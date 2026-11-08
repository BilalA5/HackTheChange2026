// Pure helpers for the Stage workspace and Review page. No React, no network, so they are easy to test.
import {
  RUBRIC_AXES,
  type Id,
  type Objective,
  type Rubric,
  type RubricLevel,
  type Stage,
  type StageProgress,
  type SubmissionKind,
} from "@pw/shared";

// ───────────────────────────── rail width ─────────────────────────────

export const RAIL_DEFAULT_WIDTH = 312;
export const RAIL_MIN_WIDTH = 272;
export const RAIL_MAX_WIDTH = 460;
export const RAIL_STORAGE_KEY = "pw.stage.railWidth";

/** Clamps a rail width to 272–460 px. Non-finite input falls back to the default. */
export function clampRailWidth(width: number): number {
  if (!Number.isFinite(width)) return RAIL_DEFAULT_WIDTH;
  return Math.min(RAIL_MAX_WIDTH, Math.max(RAIL_MIN_WIDTH, Math.round(width)));
}

function safeLocalStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/** Reads the persisted rail width. Missing, blank or broken values give the default. */
export function readRailWidth(storage: Storage | null = safeLocalStorage()): number {
  try {
    const raw = storage?.getItem(RAIL_STORAGE_KEY);
    if (raw === null || raw === undefined || raw.trim() === "") return RAIL_DEFAULT_WIDTH;
    return clampRailWidth(Number(raw));
  } catch {
    return RAIL_DEFAULT_WIDTH;
  }
}

/** Persists the rail width (clamped). Storage errors are ignored. */
export function writeRailWidth(width: number, storage: Storage | null = safeLocalStorage()): void {
  try {
    storage?.setItem(RAIL_STORAGE_KEY, String(clampRailWidth(width)));
  } catch {
    // Private mode or blocked storage: the width simply is not remembered.
  }
}

// ───────────────────────────── submissions ─────────────────────────────

export const SUBMISSION_TEXT_MAX = 20_000;
export const UPLOAD_MAX_BYTES = 25 * 1024 * 1024;

export interface SubmissionDraft {
  text: string;
  url: string;
  github: string;
  /** Uploaded files, already stored on the server. value is the served URL. */
  files: { value: string; fileName: string }[];
}

export interface SubmissionInput {
  kind: SubmissionKind;
  value: string;
  fileName?: string;
}

export type SubmissionErrorKey = SubmissionKind | "form";
export type SubmissionErrors = Partial<Record<SubmissionErrorKey, string>>;

export interface SubmissionValidation {
  valid: boolean;
  errors: SubmissionErrors;
  submissions: SubmissionInput[];
}

/** Returns the URL when raw is an absolute http(s) URL, otherwise null. */
export function parseHttpUrl(raw: string): URL | null {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u : null;
  } catch {
    return null;
  }
}

/** True for an http(s) link on github.com that names a repository (owner/repo). */
export function isGithubUrl(raw: string): boolean {
  const u = parseHttpUrl(raw);
  if (!u) return false;
  const host = u.hostname.toLowerCase();
  if (host !== "github.com" && host !== "www.github.com") return false;
  return u.pathname.split("/").filter(Boolean).length >= 2;
}

/**
 * Validates the learner's draft against the kinds this stage accepts. Kinds that are not in `kinds`
 * are ignored. Recording is never a draft input (it happens on the presentation stage).
 */
export function validateSubmission(kinds: readonly SubmissionKind[], draft: SubmissionDraft): SubmissionValidation {
  const errors: SubmissionErrors = {};
  const submissions: SubmissionInput[] = [];
  const accepts = (k: SubmissionKind) => kinds.includes(k);

  if (accepts("text")) {
    const text = draft.text.trim();
    if (text.length > SUBMISSION_TEXT_MAX) {
      errors.text = `Keep it under ${SUBMISSION_TEXT_MAX.toLocaleString("en-US")} characters.`;
    } else if (text) {
      submissions.push({ kind: "text", value: text });
    }
  }
  if (accepts("url")) {
    const url = draft.url.trim();
    if (url) {
      if (parseHttpUrl(url)) submissions.push({ kind: "url", value: url });
      else errors.url = "Enter a full link that starts with https://";
    }
  }
  if (accepts("github")) {
    const repo = draft.github.trim();
    if (repo) {
      if (isGithubUrl(repo)) submissions.push({ kind: "github", value: repo });
      else errors.github = "Use a github.com repository link, for example https://github.com/owner/repo";
    }
  }
  if (accepts("file")) {
    for (const f of draft.files) submissions.push({ kind: "file", value: f.value, fileName: f.fileName });
  }

  const hasErrors = Object.keys(errors).length > 0;
  if (!hasErrors && submissions.length === 0) {
    errors.form = "Add at least one piece of work before you submit.";
  }
  return { valid: !hasErrors && submissions.length > 0, errors, submissions };
}

// ───────────────────────────── routing ─────────────────────────────

export interface RouteStage {
  id: Id;
  order: number;
  kind: Stage["kind"];
}

export interface NextStageRoute {
  stageId: Id;
  kind: Stage["kind"];
  path: string;
}

/** Route for a stage. Presentation stages live under /present. */
export function stagePath(objectiveId: string, stage: { id: Id; kind: Stage["kind"] }): string {
  const base = `/objective/${encodeURIComponent(objectiveId)}/stage/${encodeURIComponent(stage.id)}`;
  return stage.kind === "presentation" ? `${base}/present` : base;
}

/** The stage with the next order after currentStageId, or null when it is the last one. */
export function nextStageRoute(objectiveId: string, stages: readonly RouteStage[], currentStageId: Id): NextStageRoute | null {
  const current = stages.find((s) => s.id === currentStageId);
  if (!current) return null;
  const next = stages.filter((s) => s.order > current.order).sort((a, b) => a.order - b.order)[0];
  if (!next) return null;
  return { stageId: next.id, kind: next.kind, path: stagePath(objectiveId, next) };
}

// ───────────────────────────── objective state ─────────────────────────────

/** Returns a copy of the objective with one stage's progress patched. Unknown stages are returned unchanged. */
export function withStageProgress(objective: Objective, stageId: Id, patch: Partial<StageProgress>): Objective {
  const current = objective.stages[stageId];
  if (!current) return objective;
  return { ...objective, stages: { ...objective.stages, [stageId]: { ...current, ...patch } } };
}

/** Stage status with a safe default. A stage with no progress entry is treated as locked. */
export function stageStatusOf(objective: Objective | undefined, stageId: Id): StageProgress["status"] {
  return objective?.stages[stageId]?.status ?? "locked";
}

// ───────────────────────────── checklist ─────────────────────────────

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

/**
 * The learner's checklist: every agreed requirement, with the done state from the saved todos
 * (matched by text). Extra todos that are not requirements are kept at the end.
 */
export function mergeChecklist(requirements: readonly string[], todos: readonly ChecklistItem[]): ChecklistItem[] {
  // Server todos are the source of truth once the plan is agreed (they persist ticks).
  // Before that, show the agreed requirements as unticked items.
  if (todos.length > 0) return todos.map((t) => ({ id: t.id, text: t.text, done: t.done }));
  return requirements.map((text, i) => ({ id: `req-${i}`, text, done: false }));
}

export function toggleChecklistItem(items: readonly ChecklistItem[], id: string): ChecklistItem[] {
  return items.map((it) => (it.id === id ? { ...it, done: !it.done } : it));
}

// ───────────────────────────── rubric and formatting ─────────────────────────────

const LEVEL_SCORE: Record<RubricLevel, number> = { below: 0, meeting: 1, exceeding: 2 };
const SCORE_LEVEL: RubricLevel[] = ["below", "meeting", "exceeding"];

/** One overall level from four axes: the rounded average of the axis levels. */
export function overallFromRubric(rubric: Rubric): RubricLevel {
  const total = RUBRIC_AXES.reduce((sum, axis) => sum + LEVEL_SCORE[rubric[axis].level], 0);
  return SCORE_LEVEL[Math.round(total / RUBRIC_AXES.length)];
}

/** Human duration: "< 1 min", "12 min", "1 h", "2 h 5 min". */
export function formatDuration(totalSec: number): string {
  if (!Number.isFinite(totalSec) || totalSec <= 0) return "0 min";
  if (totalSec < 60) return "< 1 min";
  const minutes = Math.round(totalSec / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** File size: "512 B", "48 KB", "3.2 MB". */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ───────────────────────────── errors ─────────────────────────────

export type StageNoticeKind = "credits" | "conflict" | "forbidden" | "network" | "error";

export interface StageNotice {
  kind: StageNoticeKind;
  message: string;
}

interface ApiErrorLike {
  status: number;
  code: string;
  message: string;
}

function isApiErrorLike(e: unknown): e is ApiErrorLike {
  if (typeof e !== "object" || e === null) return false;
  const r = e as Record<string, unknown>;
  return typeof r.status === "number" && typeof r.code === "string" && typeof r.message === "string";
}

/** Maps an API failure to a notice the page can show. Duck-typed so this file stays dependency-free. */
export function describeStageError(e: unknown): StageNotice {
  if (isApiErrorLike(e)) {
    if (e.code === "insufficient_credits" || e.status === 402) {
      return { kind: "credits", message: "You are out of credits for this action. Top up to continue." };
    }
    if (e.status === 409) {
      return {
        kind: "conflict",
        message: "This stage is already submitted or not ready yet. Refresh to see the latest state.",
      };
    }
    if (e.status === 403) {
      return {
        kind: "forbidden",
        message: e.code === "locked" ? "This stage is locked until the one before it is complete." : e.message || "You cannot do this yet.",
      };
    }
    if (e.status === 0 || e.code === "network") {
      return { kind: "network", message: "Cannot reach the Proofwork server. Check that it is running." };
    }
    return { kind: "error", message: e.message || "Something went wrong." };
  }
  if (e instanceof Error && e.message) return { kind: "error", message: e.message };
  return { kind: "error", message: "Something went wrong." };
}
