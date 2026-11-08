// Objective lifecycle: create, kickoff (watch, notes, questions), Proof of Understanding and time tracking.
import {
  NOTE_XP,
  POU_PASS_XP,
  type KickoffSegment,
  type NoteSection,
  type NoteVerdict,
  type Objective,
  type PouTurn,
  type Scenario,
  type StageProgress,
} from "@pw/shared";
import type { ResolvedScenario } from "../content.ts";
import { hasXpReason, awardXp, recordActivity, releaseHeldXp } from "./progress.ts";
import { conflict, locked, notFound } from "../errors.ts";
import type { Core } from "../types.ts";
import { clamp, nowIso, uid, withLock } from "../util.ts";
import { asObject, optStr, reqEnum, reqNum, reqStr } from "../validate.ts";
import { paidCall } from "./credits.ts";
import { notify } from "./notifications.ts";
import { findObjectiveByScenario, insertObjective, listObjectives, mutateObjective, objectivesByScenario, requireObjective } from "./objective-store.ts";
import { scenarioStatus } from "./catalog.ts";

const PHASES = ["brief", "kickoff", "pou", "stages", "complete"] as const;
const NOTE_SECTIONS: NoteSection[] = ["problem", "outcome", "process"];

export function newObjective(scenario: Scenario): Objective {
  const stages: Record<string, StageProgress> = {};
  for (const stage of scenario.stages) {
    stages[stage.id] = {
      stageId: stage.id,
      status: "locked",
      mode: "plan",
      agreedRequirements: [],
      estimatedMinutes: null,
      planComplete: false,
      planMessages: [],
      learnMessages: [],
      learnCompleted: [],
      todos: [],
      submissions: [],
      evaluation: null,
      startedAt: null,
      timeSpentSec: 0,
    };
  }
  return {
    id: uid(),
    scenarioId: scenario.id,
    status: "in_progress",
    phase: "brief",
    startedAt: nowIso(),
    completedAt: null,
    timeSpentSec: 0,
    xpEarned: 0,
    xpHeld: 0,
    currentStageId: null,
    performance: null,
    notes: { problem: "", outcome: "", process: "" },
    noteVerdicts: {},
    kickoffWatched: [],
    kickoffQuestions: [],
    pou: { status: "not_started", turns: [], questionIndex: 0, followUpAsked: false },
    stages,
  };
}

export function resolveFor(core: Core, obj: Objective): ResolvedScenario {
  const resolved = core.content.resolveScenario(obj.scenarioId);
  if (!resolved) throw new Error(`Content missing for scenario ${obj.scenarioId}`);
  return resolved;
}

export function findSegment(scenario: Scenario, segmentId: string): KickoffSegment {
  const segment = scenario.kickoff.segments.find((s) => s.id === segmentId);
  if (!segment) throw notFound("Kickoff segment not found.");
  return segment;
}

export function makeTurn(role: PouTurn["role"], text: string, questionId: string): PouTurn {
  return { id: uid(), role, text, questionId, at: nowIso() };
}

export function listUserObjectives(core: Core, userId: string): Objective[] {
  return listObjectives(core.db, userId);
}

export function getUserObjective(core: Core, userId: string, id: string): Objective {
  return requireObjective(core.db, userId, id);
}

export async function createObjective(core: Core, userId: string, scenarioId: string): Promise<Objective> {
  const scenario = core.content.getScenario(scenarioId);
  if (!scenario) throw notFound("Scenario not found.");
  return withLock(`create:${userId}:${scenarioId}`, async () => {
    const existing = findObjectiveByScenario(core.db, userId, scenarioId);
    if (existing) return existing;
    if (scenarioStatus(core, scenario, objectivesByScenario(core.db, userId)) === "locked") {
      throw locked("Finish the previous project to unlock this one.");
    }
    const objective = newObjective(scenario);
    insertObjective(core.db, userId, objective);
    return objective;
  });
}

/** PATCH: phase may only move brief -> kickoff; notes accept the three sections. */
export function patchObjective(core: Core, userId: string, objectiveId: string, body: unknown): Promise<Objective> {
  const o = asObject(body);
  const phase = o.phase === undefined ? undefined : reqEnum(o, "phase", PHASES);
  const notesIn = o.notes === undefined ? undefined : asObject(o.notes, "notes");
  const notesPatch: Partial<Record<NoteSection, string>> = {};
  if (notesIn) {
    for (const section of NOTE_SECTIONS) {
      if (notesIn[section] !== undefined) notesPatch[section] = reqStr(notesIn, section, { min: 0, max: 5000 });
    }
  }
  return mutateObjective(core, userId, objectiveId, (obj) => {
    if (phase !== undefined && phase !== obj.phase) {
      if (!(obj.phase === "brief" && phase === "kickoff")) throw conflict(`Cannot move from ${obj.phase} to ${phase}.`);
      obj.phase = "kickoff";
    }
    Object.assign(obj.notes, notesPatch);
    return obj;
  });
}

export function markWatched(core: Core, userId: string, objectiveId: string, body: unknown): Promise<Objective> {
  const segmentId = reqStr(asObject(body), "segmentId", { max: 128 });
  return mutateObjective(core, userId, objectiveId, (obj) => {
    findSegment(resolveFor(core, obj).scenario, segmentId);
    if (!obj.kickoffWatched.includes(segmentId)) obj.kickoffWatched.push(segmentId);
    if (obj.phase === "brief") obj.phase = "kickoff";
    return obj;
  });
}

export function notesCheck(
  core: Core,
  userId: string,
  objectiveId: string,
  body: unknown,
): Promise<{ verdict: NoteVerdict; objective: Objective }> {
  const o = asObject(body);
  const segmentId = reqStr(o, "segmentId", { max: 128 });
  const text = reqStr(o, "text", { max: 5000 });
  return mutateObjective(core, userId, objectiveId, async (obj) => {
    const { scenario } = resolveFor(core, obj);
    const segment = findSegment(scenario, segmentId);
    if (obj.phase === "pou" || obj.phase === "stages" || obj.phase === "complete") {
      throw conflict("Kickoff notes are closed for this project.");
    }
    const checked = await paidCall(core, userId, "note_check", () => core.ai.checkNote({ scenario, segment, text }));
    const reason = `Kickoff note accepted: ${segment.title}`;
    const firstAcceptance = checked.accepted && !hasXpReason(core.db, userId, obj.scenarioId, reason);
    const xp = firstAcceptance ? NOTE_XP[segment.noteSection] : 0;
    const verdict: NoteVerdict = { ...checked, xp };
    obj.notes[segment.noteSection] = text;
    obj.noteVerdicts[segment.id] = verdict;
    if (obj.phase === "brief") obj.phase = "kickoff";
    if (xp > 0) {
      obj.xpHeld += xp;
      awardXp(core, userId, xp, reason, obj.scenarioId, true);
    }
    return { verdict, objective: obj };
  });
}

export function askKickoff(core: Core, userId: string, objectiveId: string, body: unknown): Promise<{ answer: string; objective: Objective }> {
  const o = asObject(body);
  const segmentId = reqStr(o, "segmentId", { max: 128 });
  const question = reqStr(o, "question", { max: 1000 });
  return mutateObjective(core, userId, objectiveId, async (obj) => {
    const { scenario, npc, company } = resolveFor(core, obj);
    const segment = findSegment(scenario, segmentId);
    const answer = await paidCall(core, userId, "kickoff_question", () =>
      core.ai.answerKickoffQuestion({ scenario, npc, company, segment, question }),
    );
    obj.kickoffQuestions.push({ segmentId, question, answer, at: nowIso() });
    return { answer, objective: obj };
  });
}

export function completeKickoff(core: Core, userId: string, objectiveId: string): Promise<Objective> {
  return mutateObjective(core, userId, objectiveId, (obj) => {
    const { scenario } = resolveFor(core, obj);
    const missing = scenario.kickoff.segments.filter((s) => obj.noteVerdicts[s.id]?.accepted !== true);
    if (missing.length > 0) {
      throw conflict(`Write an accepted note for every kickoff section first (${missing.length} left).`);
    }
    if (obj.phase === "kickoff") obj.phase = "pou";
    return obj;
  });
}

export function startPou(core: Core, userId: string, objectiveId: string): Promise<{ question: PouTurn; objective: Objective }> {
  return mutateObjective(core, userId, objectiveId, (obj) => {
    if (obj.phase !== "pou") throw conflict("Finish the kickoff before the proof of understanding.");
    const { scenario } = resolveFor(core, obj);
    const current = scenario.pou[obj.pou.questionIndex];
    if (!current) throw conflict("No proof-of-understanding question is pending.");
    obj.pou.status = "in_progress";
    const lastLearner = obj.pou.turns.reduce((idx, t, i) => (t.role === "learner" ? i : idx), -1);
    const promptPending = obj.pou.turns
      .slice(lastLearner + 1)
      .some((t) => t.role === "npc" && t.questionId === current.id);
    if (!promptPending) obj.pou.turns.push(makeTurn("npc", current.prompt, current.id));
    const question = [...obj.pou.turns].reverse().find((t) => t.role === "npc");
    if (!question) throw new Error("No manager turn to show.");
    return { question, objective: obj };
  });
}

/** Moves to the next question, or finishes the proof and releases held XP. */
function advancePou(core: Core, userId: string, obj: Objective, scenario: Scenario): PouTurn | null {
  obj.pou.questionIndex += 1;
  obj.pou.followUpAsked = false;
  const next = scenario.pou[obj.pou.questionIndex];
  if (next) return makeTurn("npc", next.prompt, next.id);
  finishPou(core, userId, obj, scenario);
  return null;
}

function finishPou(core: Core, userId: string, obj: Objective, scenario: Scenario): void {
  obj.pou.status = "passed";
  obj.phase = "stages";
  const released = obj.xpHeld;
  obj.xpEarned += released;
  obj.xpHeld = 0;
  releaseHeldXp(core.db, userId, scenario.id);
  awardXp(core, userId, POU_PASS_XP, "Proof of understanding passed", scenario.id);
  obj.xpEarned += POU_PASS_XP;
  const first = [...scenario.stages].sort((a, b) => a.order - b.order)[0];
  const firstProgress = first ? obj.stages[first.id] : undefined;
  if (first && firstProgress) {
    firstProgress.status = "available";
    obj.currentStageId = first.id;
  }
  notify(core, userId, {
    category: "progress",
    title: "XP unlocked",
    body: `${released + POU_PASS_XP} XP from ${scenario.title} is now yours.`,
    link: `/objective/${obj.id}`,
  });
}

export function answerPou(
  core: Core,
  userId: string,
  objectiveId: string,
  body: unknown,
): Promise<{ reaction: PouTurn; next: PouTurn | null; status: Objective["pou"]["status"]; objective: Objective }> {
  const transcript = reqStr(asObject(body), "transcript", { max: 5000 });
  return mutateObjective(core, userId, objectiveId, async (obj) => {
    if (obj.phase !== "pou") throw conflict("The proof of understanding is not open.");
    if (obj.pou.status === "not_started") throw conflict("Start the proof of understanding first.");
    if (obj.pou.status === "passed") throw conflict("The proof of understanding is already passed.");
    const { scenario, npc } = resolveFor(core, obj);
    const question = scenario.pou[obj.pou.questionIndex];
    if (!question) throw conflict("No question is pending.");

    const judged = await paidCall(core, userId, "pou_turn", () =>
      core.ai.judgePou({ scenario, npc, question, transcript, isFollowUp: obj.pou.followUpAsked, notes: obj.notes }),
    );
    obj.pou.turns.push(makeTurn("learner", transcript, question.id));
    const reaction = makeTurn("npc", judged.reaction, question.id);
    obj.pou.turns.push(reaction);
    obj.pou.status = "in_progress";

    let next: PouTurn | null = null;
    if (judged.verdict !== "pass" && !obj.pou.followUpAsked) {
      obj.pou.followUpAsked = true;
      next = makeTurn("npc", question.followUp, question.id);
    } else if (judged.verdict === "pass" || judged.verdict === "partial") {
      next = advancePou(core, userId, obj, scenario);
    } else {
      obj.pou.status = "needs_retry";
      obj.pou.followUpAsked = false;
      next = makeTurn("npc", question.prompt, question.id);
    }
    if (next) obj.pou.turns.push(next);
    return { reaction, next, status: obj.pou.status, objective: obj };
  });
}

export function recordTime(core: Core, userId: string, objectiveId: string, body: unknown): Promise<{ ok: true }> {
  const o = asObject(body);
  const seconds = clamp(reqNum(o, "seconds"), 0, 300);
  const stageId = optStr(o, "stageId", { max: 128 });
  return mutateObjective(core, userId, objectiveId, (obj) => {
    if (stageId) {
      const stage = obj.stages[stageId];
      if (!stage) throw notFound("Stage not found.");
      stage.timeSpentSec += seconds;
    }
    obj.timeSpentSec += seconds;
    recordActivity(core.db, userId);
    return { ok: true as const };
  });
}

