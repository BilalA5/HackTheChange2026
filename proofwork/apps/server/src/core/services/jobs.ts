// Job portal and assist-apply drafts. Nothing is ever sent on the learner's behalf.
import { JOB_PORTAL_UNLOCK_SCENARIOS, type Job, type JobApplication } from "@pw/shared";
import { all, one, run, type Db } from "../db.ts";
import { badRequest, locked, notFound } from "../errors.ts";
import type { Core } from "../types.ts";
import { nowIso, uid } from "../util.ts";
import { asObject, isObject, optStr, reqEnum, type Obj } from "../validate.ts";
import { contentFor } from "../user-content.ts";
import { paidCall } from "./credits.ts";
import { completedObjectives } from "./objective-store.ts";
import { getPortfolio } from "./portfolio.ts";
import { requireUser } from "./users.ts";

const APPLICATION_STATUSES = ["draft", "ready", "submitted"] as const;
const SUBMITTED_LOG = "Marked as submitted by you. Proofwork never submits applications on your behalf.";

/** Jobs for the learner's current career first, then authored jobs, then jobs from their other generated paths. */
export function listJobs(core: Core, userId: string): { unlocked: boolean; jobs: Job[] } {
  const user = requireUser(core.db, userId);
  const content = contentFor(core, userId);
  const unlocked = completedObjectives(core.db, userId).length >= JOB_PORTAL_UNLOCK_SCENARIOS;
  const generatedCareers = new Set(content.careers.filter((c) => c.generated).map((c) => c.id));
  const rank = (job: Job): number => {
    if (job.careerId === user.careerId) return 0;
    return generatedCareers.has(job.careerId) ? 2 : 1;
  };
  const jobs = [...content.jobs].sort((a, b) => rank(a) - rank(b));
  return { unlocked, jobs };
}

interface AppRow {
  data: string;
}

export function listApplications(db: Db, userId: string): JobApplication[] {
  return all<AppRow>(db, "SELECT data FROM applications WHERE user_id = ? ORDER BY rowid DESC", [userId]).map(
    (r) => JSON.parse(r.data) as JobApplication,
  );
}

function insertApplication(db: Db, userId: string, app: JobApplication): void {
  run(db, "INSERT INTO applications (id, user_id, job_id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)", [
    app.id,
    userId,
    app.jobId,
    JSON.stringify(app),
    app.createdAt,
    app.createdAt,
  ]);
}

export async function draftApplication(core: Core, userId: string, jobId: string): Promise<JobApplication> {
  const job = contentFor(core, userId).getJob(jobId);
  if (!job) throw notFound("Job not found.");
  if (completedObjectives(core.db, userId).length < JOB_PORTAL_UNLOCK_SCENARIOS) {
    throw locked("Complete a project to unlock the job portal.");
  }
  const user = requireUser(core.db, userId);
  const portfolio = getPortfolio(core, userId);
  const draft = await paidCall(core, userId, "application_draft", () => core.ai.draftApplication({ job, user, portfolio }));
  const now = nowIso();
  const app: JobApplication = {
    id: uid(),
    jobId: job.id,
    status: "draft",
    answers: draft.answers,
    guessed: draft.guessed,
    coverLetter: draft.coverLetter,
    log: [{ at: now, text: `Draft created for ${job.title} at ${job.company}. Review every answer before you apply.` }],
    createdAt: now,
  };
  insertApplication(core.db, userId, app);
  return app;
}

/** Answers must be a flat map of short strings. */
function parseAnswers(raw: unknown): Record<string, string> {
  if (!isObject(raw)) throw badRequest("answers must be an object.");
  const entries = Object.entries(raw as Obj);
  if (entries.length > 50) throw badRequest("answers can hold at most 50 entries.");
  const out: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (key.length > 100) throw badRequest("answer keys must be at most 100 characters.");
    if (typeof value !== "string") throw badRequest(`answers.${key} must be a string.`);
    if (value.length > 4000) throw badRequest(`answers.${key} must be at most 4000 characters.`);
    out[key] = value;
  }
  return out;
}

export function updateApplication(core: Core, userId: string, appId: string, body: unknown): JobApplication {
  const o = asObject(body);
  const answers = o.answers === undefined ? undefined : parseAnswers(o.answers);
  const coverLetter = optStr(o, "coverLetter", { max: 10_000 });
  const status = o.status === undefined ? undefined : reqEnum(o, "status", APPLICATION_STATUSES);
  const row = one<AppRow>(core.db, "SELECT data FROM applications WHERE id = ? AND user_id = ?", [appId, userId]);
  if (!row) throw notFound("Application not found.");
  const app = JSON.parse(row.data) as JobApplication;

  if (answers) {
    for (const [key, value] of Object.entries(answers)) {
      app.answers[key] = value;
      app.guessed = app.guessed.filter((k) => k !== key);
    }
  }
  if (coverLetter !== undefined) app.coverLetter = coverLetter;
  if (status !== undefined && status !== app.status) {
    app.status = status;
    app.log.push({ at: nowIso(), text: status === "submitted" ? SUBMITTED_LOG : `Status changed to ${status}.` });
  }
  run(core.db, "UPDATE applications SET data = ?, updated_at = ? WHERE id = ? AND user_id = ?", [JSON.stringify(app), nowIso(), app.id, userId]);
  return app;
}
