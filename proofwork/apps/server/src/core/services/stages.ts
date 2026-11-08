// Stage flow: start, mode, Plan negotiation, Learn tutoring, todos, work submissions and the presentation.
import {
  EVAL_XP_RATIO,
  type ChatMessage,
  type Evaluation,
  type Objective,
  type PresentationInput,
  type Scenario,
  type Stage,
  type StageProgress,
  type SubmissionKind,
  type Npc,
  type Company,
  type Submission,
} from "@pw/shared";
import type { GradeResult } from "../../contracts.ts";
import { badRequest, conflict, locked, notFound } from "../errors.ts";
import type { Core } from "../types.ts";
import { nowIso, uid, errorMessage } from "../util.ts";
import { asObject, reqArray, reqBool, reqEnum, reqNum, reqStr } from "../validate.ts";
import { awardXp } from "./progress.ts";
import { notify } from "./notifications.ts";
import { paidCall } from "./credits.ts";
import { mutateObjective, listObjectives } from "./objective-store.ts";
import { requireUser } from "./users.ts";
import { resolveFor } from "./objectives.ts";
import { allEvaluations, computePerformance } from "./performance.ts";
import { projectFor, savePortfolioCopy } from "./portfolio.ts";
import { readUploadText } from "./uploads.ts";

const SUBMISSION_KINDS: SubmissionKind[] = ["text", "url", "github", "file", "recording"];
const STAGE_MODES = ["plan", "do", "learn"] as const;

interface StageCtx {
  scenario: Scenario;
  npc: Npc;
  company: Company;
  content: Stage;
  progress: StageProgress;
}

function makeChat(role: ChatMessage["role"], text: string): ChatMessage {
  return { id: uid(), role, text, at: nowIso() };
}

function stageCtx(core: Core, userId: string, obj: Objective, stageId: string): StageCtx {
  const { scenario, npc, company } = resolveFor(core, userId, obj);
  const content = scenario.stages.find((s) => s.id === stageId);
  const progress = obj.stages[stageId];
  if (!content || !progress) throw notFound("Stage not found.");
  return { scenario, npc, company, content, progress };
}

function assertNotLocked(ctx: StageCtx): void {
  if (ctx.progress.status === "locked") throw locked("This stage is still locked.");
}

function assertStagesPhase(obj: Objective): void {
  if (obj.phase !== "stages") throw conflict("Finish the proof of understanding before starting stages.");
}

export function startStage(core: Core, userId: string, objectiveId: string, stageId: string): Promise<Objective> {
  return mutateObjective(core, userId, objectiveId, (obj) => {
    assertStagesPhase(obj);
    const ctx = stageCtx(core, userId, obj, stageId);
    assertNotLocked(ctx);
    if (ctx.progress.status !== "completed") ctx.progress.status = "in_progress";
    if (!ctx.progress.startedAt) ctx.progress.startedAt = nowIso();
    ctx.progress.mode = "plan";
    obj.currentStageId = stageId;
    return obj;
  });
}

export function setStageMode(core: Core, userId: string, objectiveId: string, stageId: string, body: unknown): Promise<Objective> {
  const mode = reqEnum(asObject(body), "mode", STAGE_MODES);
  return mutateObjective(core, userId, objectiveId, (obj) => {
    const ctx = stageCtx(core, userId, obj, stageId);
    assertNotLocked(ctx);
    ctx.progress.mode = mode;
    return obj;
  });
}

export function planMessage(
  core: Core,
  userId: string,
  objectiveId: string,
  stageId: string,
  body: unknown,
): Promise<{ reply: ChatMessage; objective: Objective }> {
  const message = reqStr(asObject(body), "message", { max: 2000 });
  return mutateObjective(core, userId, objectiveId, async (obj) => {
    assertStagesPhase(obj);
    const ctx = stageCtx(core, userId, obj, stageId);
    assertNotLocked(ctx);
    const learnerName = requireUser(core.db, userId).name;
    const history = [...ctx.progress.planMessages];
    const result = await paidCall(core, userId, "plan_turn", () =>
      core.ai.planTurn({ scenario: ctx.scenario, stage: ctx.content, npc: ctx.npc, history, message, learnerName }),
    );
    const reply = makeChat("npc", result.reply);
    ctx.progress.planMessages.push(makeChat("learner", message), reply);
    ctx.progress.agreedRequirements = result.agreedRequirements;
    ctx.progress.estimatedMinutes = result.estimatedMinutes;
    ctx.progress.planComplete ||= result.isComplete;
    if (result.isComplete && ctx.progress.todos.length === 0) {
      ctx.progress.todos = result.todos.map((text) => ({ id: uid(), text, done: false }));
    }
    return { reply, objective: obj };
  });
}

export function learnChat(
  core: Core,
  userId: string,
  objectiveId: string,
  stageId: string,
  body: unknown,
): Promise<{ reply: ChatMessage; objective: Objective }> {
  const message = reqStr(asObject(body), "message", { max: 2000 });
  return mutateObjective(core, userId, objectiveId, async (obj) => {
    const ctx = stageCtx(core, userId, obj, stageId);
    assertNotLocked(ctx);
    const history = [...ctx.progress.learnMessages];
    const text = await paidCall(core, userId, "learn_chat", () =>
      core.ai.learnChat({ scenario: ctx.scenario, stage: ctx.content, history, message }),
    );
    const reply = makeChat("npc", text);
    ctx.progress.learnMessages.push(makeChat("learner", message), reply);
    return { reply, objective: obj };
  });
}

export function completeLearnItem(core: Core, userId: string, objectiveId: string, stageId: string, itemId: string): Promise<Objective> {
  return mutateObjective(core, userId, objectiveId, (obj) => {
    const ctx = stageCtx(core, userId, obj, stageId);
    if (!ctx.content.learn.some((item) => item.id === itemId)) throw notFound("Learn item not found.");
    if (!ctx.progress.learnCompleted.includes(itemId)) ctx.progress.learnCompleted.push(itemId);
    return obj;
  });
}

export function setTodos(core: Core, userId: string, objectiveId: string, stageId: string, body: unknown): Promise<Objective> {
  const raw = reqArray(asObject(body), "todos", { max: 50 });
  const todos = raw.map((item) => {
    const t = asObject(item, "todo");
    return { id: reqStr(t, "id", { max: 100 }), text: reqStr(t, "text", { max: 500 }), done: reqBool(t, "done") };
  });
  return mutateObjective(core, userId, objectiveId, (obj) => {
    const ctx = stageCtx(core, userId, obj, stageId);
    assertNotLocked(ctx);
    ctx.progress.todos = todos;
    return obj;
  });
}

function parseSubmission(raw: unknown): { kind: SubmissionKind; value: string; fileName?: string } {
  const o = asObject(raw, "submission");
  const kind = reqEnum(o, "kind", SUBMISSION_KINDS);
  const value = reqStr(o, "value", { max: 4000 });
  const fileName = o.fileName === undefined || o.fileName === null ? undefined : reqStr(o, "fileName", { max: 200 });
  return fileName ? { kind, value, fileName } : { kind, value };
}

function buildSignals(obj: Objective, progress: StageProgress) {
  return {
    planComplete: progress.planComplete,
    agreedRequirements: progress.agreedRequirements,
    learnItemsCompleted: progress.learnCompleted.length,
    learnChats: progress.learnMessages.filter((m) => m.role === "learner").length,
    managerQuestions:
      obj.kickoffQuestions.length + progress.planMessages.filter((m) => m.role === "learner" && m.text.includes("?")).length,
    minutesSpent: Math.round(progress.timeSpentSec / 60),
  };
}

/** Applies a graded result to the stage and objective. Returns the stored evaluation. */
function applyEvaluation(core: Core, userId: string, obj: Objective, ctx: StageCtx, result: GradeResult): Evaluation {
  const wasPassed = ctx.progress.status === "completed";
  const xp = result.passed && !wasPassed ? Math.round(ctx.content.xp * EVAL_XP_RATIO[result.overall]) : 0;
  const evaluation: Evaluation = { id: uid(), ...result, xp, createdAt: nowIso() };
  ctx.progress.evaluation = evaluation;
  if (result.passed) {
    if (!wasPassed) {
      ctx.progress.status = "completed";
      unlockNextStage(obj, ctx.scenario, ctx.content.id);
    }
  } else if (!wasPassed) {
    ctx.progress.status = "in_progress";
  }
  if (xp > 0) {
    obj.xpEarned += xp;
    awardXp(core, userId, xp, `Stage complete: ${ctx.content.title}`, obj.scenarioId);
  }
  obj.performance = computePerformance(obj);
  notify(core, userId, {
    category: "feedback",
    title: "Feedback ready",
    body: `${ctx.content.title}: ${result.summary}`.slice(0, 280),
    link: `/objective/${obj.id}`,
  });
  return evaluation;
}

function unlockNextStage(obj: Objective, scenario: Scenario, stageId: string): void {
  const ordered = [...scenario.stages].sort((a, b) => a.order - b.order);
  const index = ordered.findIndex((s) => s.id === stageId);
  const next = index >= 0 ? ordered[index + 1] : undefined;
  if (!next) return;
  const progress = obj.stages[next.id];
  if (progress && progress.status === "locked") progress.status = "available";
  obj.currentStageId = next.id;
}

export function submitWork(
  core: Core,
  userId: string,
  objectiveId: string,
  stageId: string,
  body: unknown,
): Promise<{ evaluation: Evaluation; objective: Objective }> {
  const raw = reqArray(asObject(body), "submissions", { min: 1, max: 10 });
  const inputs = raw.map(parseSubmission);
  return mutateObjective(core, userId, objectiveId, async (obj) => {
    assertStagesPhase(obj);
    const ctx = stageCtx(core, userId, obj, stageId);
    assertNotLocked(ctx);
    if (ctx.content.kind !== "work") throw conflict("Use the presentation endpoint for this stage.");
    for (const input of inputs) {
      if (!ctx.content.submission.kinds.includes(input.kind)) {
        throw badRequest(`${input.kind} submissions are not accepted for this stage.`);
      }
    }
    const created: Submission[] = inputs.map((input) => ({
      id: uid(),
      kind: input.kind,
      value: input.value,
      ...(input.fileName ? { fileName: input.fileName } : {}),
      createdAt: nowIso(),
    }));
    const fileTexts: Record<string, string> = {};
    for (const sub of created) {
      const text = readUploadText(core, userId, sub.value);
      if (text !== null) fileTexts[sub.id] = text;
    }
    ctx.progress.submissions.push(...created);
    const result = await paidCall(core, userId, "submission_eval", () =>
      core.ai.gradeSubmission({
        scenario: ctx.scenario,
        stage: ctx.content,
        submissions: created,
        fileTexts,
        notes: obj.notes,
        signals: buildSignals(obj, ctx.progress),
      }),
    );
    const evaluation = applyEvaluation(core, userId, obj, ctx, result);
    return { evaluation, objective: obj };
  });
}

function parsePresentation(body: unknown): PresentationInput {
  const o = asObject(body);
  const input: PresentationInput = {
    transcript: reqStr(o, "transcript", { min: 0, max: 50_000 }),
    durationSec: reqNum(o, "durationSec", { min: 0, max: 86_400 }),
    framingScore: reqNum(o, "framingScore", { min: 0, max: 1 }),
    slidesCovered: reqNum(o, "slidesCovered", { min: 0, max: 500, integer: true }),
  };
  const recordingUrl = o.recordingUrl === undefined || o.recordingUrl === null ? undefined : reqStr(o, "recordingUrl", { max: 2048 });
  return recordingUrl ? { ...input, recordingUrl } : input;
}

export function submitPresentation(
  core: Core,
  userId: string,
  objectiveId: string,
  stageId: string,
  body: unknown,
): Promise<{ evaluation: Evaluation; objective: Objective }> {
  const input = parsePresentation(body);
  return mutateObjective(core, userId, objectiveId, async (obj) => {
    assertStagesPhase(obj);
    const ctx = stageCtx(core, userId, obj, stageId);
    if (ctx.content.kind !== "presentation") throw conflict("This stage is not a presentation.");
    const worksDone = ctx.scenario.stages
      .filter((s) => s.kind === "work")
      .every((s) => obj.stages[s.id]?.status === "completed");
    if (!worksDone) throw conflict("Complete every work stage before presenting.");
    assertNotLocked(ctx);

    const priorEvaluations = allEvaluations(obj);
    const wasFirstCompletion = listObjectives(core.db, userId).every((o) => o.status !== "completed");
    const result = await paidCall(core, userId, "presentation_eval", () =>
      core.ai.gradePresentation({ scenario: ctx.scenario, stage: ctx.content, input, priorEvaluations }),
    );
    const evaluation = applyEvaluation(core, userId, obj, ctx, result);
    if (result.passed) {
      obj.status = "completed";
      obj.phase = "complete";
      obj.completedAt = nowIso();
      notify(core, userId, {
        category: "progress",
        title: "Project complete",
        body: `${ctx.scenario.title} is done. It is now in your portfolio.`,
        link: `/objective/${obj.id}`,
      });
      if (wasFirstCompletion) await refreshPortfolioCopy(core, userId, obj);
    }
    return { evaluation, objective: obj };
  });
}

async function refreshPortfolioCopy(core: Core, userId: string, obj: Objective): Promise<void> {
  try {
    const user = requireUser(core.db, userId);
    const copy = await core.ai.portfolioBio({ user, projects: [projectFor(core, userId, obj)] });
    savePortfolioCopy(core.db, userId, copy.headline, copy.bio);
  } catch (err) {
    core.log("portfolio copy generation failed", { reason: errorMessage(err) });
  }
}


