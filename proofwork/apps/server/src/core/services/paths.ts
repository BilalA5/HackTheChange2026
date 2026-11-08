// Personal career paths: request validation, generation through the AI engine, persistence and the switch
// of the learner onto the new career. The first path is free (onboarding); later ones are charged.
import { createHash } from "node:crypto";
import type { CareerPathSummary, PathRequest, User, VisionBoard } from "@pw/shared";
import { validateCareerPack, validateJobs } from "@pw/content";
import type { GeneratedPath } from "../../contracts.ts";
import { one, run, type Db } from "../db.ts";
import { HttpError } from "../errors.ts";
import type { Core } from "../types.ts";
import { hasGeneratedPath, invalidateContent, type GeneratedPathRow } from "../user-content.ts";
import { errorMessage, nowIso, uid, withLock } from "../util.ts";
import { asObject, optStr, reqStr } from "../validate.ts";
import { paidCall } from "./credits.ts";
import { notify } from "./notifications.ts";
import { addTrainingIds } from "./trainings.ts";
import { emptyVision, requireUser, saveUser } from "./users.ts";

const OPTIONAL_FIELDS = ["level", "industry", "companyType", "location", "timeline", "why", "background"] as const;

/** Answers that mean "no preference" (the onboarding chip "Not sure yet", "any", "idk"). They are dropped, not quoted. */
const NO_PREFERENCE = /^(not sure( yet)?|unsure|n\/?a|none|no idea|idk|i don'?t know|don'?t know|any|anything|anywhere|no preference)[.!]?$/i;

/** Validates a learner's path request. targetRole is required; other fields are trimmed and empty ones dropped. */
export function parsePathRequest(raw: unknown): PathRequest {
  const o = asObject(raw, "Request body");
  const request: PathRequest = { targetRole: reqStr(o, "targetRole", { min: 2, max: 80 }) };
  for (const key of OPTIONAL_FIELDS) {
    const value = optStr(o, key, { max: 200 });
    if (value && !NO_PREFERENCE.test(value.trim())) request[key] = value;
  }
  return request;
}

/** Career id prefix for a learner's n-th path: g-<8 hex of sha256(userId)>-<n>. */
export function pathIdPrefix(userId: string, n: number): string {
  const hash = createHash("sha256").update(userId).digest("hex").slice(0, 8);
  return `g-${hash}-${n}`;
}

function nextIdPrefix(db: Db, userId: string): string {
  const count = Number(one<{ n: number }>(db, "SELECT COUNT(*) AS n FROM generated_paths WHERE user_id = ?", [userId])?.n ?? 0);
  let n = count + 1;
  while (hasGeneratedPath(db, userId, pathIdPrefix(userId, n))) n++;
  return pathIdPrefix(userId, n);
}

function couldNotBuild(): HttpError {
  return new HttpError(500, "internal", "Could not build your path, please try again");
}

function collectIds(value: unknown, out: string[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collectIds(item, out);
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === "id" && typeof child === "string") out.push(child);
      else collectIds(child, out);
    }
  }
}

/** Structural checks on a generated path. Returns the problems; empty means usable. */
function problemsWith(core: Core, generated: GeneratedPath, idPrefix: string): string[] {
  try {
    const { pack, jobs, recommendedTrainingIds } = generated;
    pack.career.generated = true;
    const problems: string[] = [];
    if (pack.career.id !== idPrefix) problems.push(`career id ${pack.career.id} must equal ${idPrefix}`);
    problems.push(...validateCareerPack(pack), ...validateJobs(jobs, [pack.career.id]));
    const ids: string[] = [];
    collectIds(pack, ids);
    collectIds(jobs, ids);
    for (const id of ids) if (!id.startsWith(idPrefix)) problems.push(`${id} does not start with ${idPrefix}`);
    const authored = new Set(core.content.trainings.map((t) => t.id));
    for (const id of recommendedTrainingIds) if (!authored.has(id)) problems.push(`unknown training ${id}`);
    return problems;
  } catch (err) {
    return [`malformed path: ${errorMessage(err)}`];
  }
}

async function generateChecked(core: Core, user: User, request: PathRequest, idPrefix: string): Promise<GeneratedPath> {
  let generated: GeneratedPath;
  try {
    generated = await core.ai.generatePath({ request, user, idPrefix, trainings: core.content.trainings });
  } catch (err) {
    core.log("path generation failed", { idPrefix, reason: errorMessage(err) });
    throw couldNotBuild();
  }
  const problems = problemsWith(core, generated, idPrefix);
  if (problems.length > 0) {
    core.log("generated path rejected", { idPrefix, problems: problems.slice(0, 20) });
    throw couldNotBuild();
  }
  return generated;
}

const VISION_FROM_REQUEST = ["level", "industry", "companyType", "location", "timeline", "why", "background"] as const;

function visionFrom(current: VisionBoard | null, request: PathRequest): VisionBoard {
  const vision: VisionBoard = { ...(current ?? emptyVision()), targetRole: request.targetRole };
  for (const key of VISION_FROM_REQUEST) {
    const value = request[key];
    if (value !== undefined) vision[key] = value;
  }
  return vision;
}

export function summaryOf(row: GeneratedPathRow): CareerPathSummary {
  const path = JSON.parse(row.data) as GeneratedPath;
  return {
    careerId: row.career_id,
    title: path.pack.career.title,
    engine: row.engine === "live" ? "live" : "practice",
    provider: row.provider,
    request: JSON.parse(row.request) as PathRequest,
    scenarioTitles: [...path.pack.scenarios].sort((a, b) => a.order - b.order).map((s) => s.title),
    createdAt: row.created_at,
  };
}

/** The learner's path summary for the career they are on, or null when that career is authored. */
export function currentPathSummary(core: Core, userId: string): CareerPathSummary | null {
  const user = requireUser(core.db, userId);
  if (!user.careerId) return null;
  const row = one<GeneratedPathRow>(core.db, "SELECT * FROM generated_paths WHERE user_id = ? AND career_id = ?", [userId, user.careerId]);
  return row ? summaryOf(row) : null;
}

/**
 * Generates, validates and saves a personal path, then makes it the learner's career.
 * charge=true debits path_generation first (402 when short, refunded if generation fails).
 * The user object is updated and saved in place; callers should not save it again before reading it.
 */
export function createPath(core: Core, user: User, request: PathRequest, opts: { charge: boolean }): Promise<CareerPathSummary> {
  return withLock(`path:${user.id}`, async () => {
    const clean = parsePathRequest(request);
    const idPrefix = nextIdPrefix(core.db, user.id);
    const generated = opts.charge
      ? await paidCall(core, user.id, "path_generation", () => generateChecked(core, user, clean, idPrefix))
      : await generateChecked(core, user, clean, idPrefix);

    const { career, scenarios } = generated.pack;
    const row: GeneratedPathRow = {
      id: uid(),
      user_id: user.id,
      career_id: career.id,
      engine: generated.engine,
      provider: core.ai.provider,
      request: JSON.stringify(clean),
      data: JSON.stringify(generated),
      created_at: nowIso(),
    };
    run(
      core.db,
      "INSERT INTO generated_paths (id, user_id, career_id, engine, provider, request, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [row.id, row.user_id, row.career_id, row.engine, row.provider, row.request, row.data, row.created_at],
    );
    invalidateContent(core, user.id);

    user.careerId = career.id;
    user.vision = visionFrom(user.vision, clean);
    saveUser(core.db, user);
    addTrainingIds(core, user.id, generated.recommendedTrainingIds);
    notify(core, user.id, {
      category: "progress",
      title: "Your path is ready",
      body: `${scenarios.length} projects built for ${clean.targetRole}`,
    });

    return summaryOf(row);
  });
}
