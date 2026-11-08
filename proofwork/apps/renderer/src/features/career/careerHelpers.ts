// Pure helpers for the career pages. No React, no I/O except the guarded localStorage speed accessors.
import type { Job, JobApplyField, Training, TrainingKind, TrainingProgress } from "@pw/shared";

// ───────────────────────────── training ─────────────────────────────

export const TRAINING_KINDS: readonly TrainingKind[] = ["skill", "mindset", "communication"];

export const TRAINING_KIND_NOUN: Record<TrainingKind, string> = {
  skill: "skill",
  mindset: "mindset",
  communication: "communication",
};

export const TRAINING_KIND_LABEL: Record<TrainingKind, string> = {
  skill: "Skills",
  mindset: "Mindset",
  communication: "Communication",
};

export function isTrainingKind(value: string | undefined): value is TrainingKind {
  return value !== undefined && (TRAINING_KINDS as readonly string[]).includes(value);
}

export interface TrainingFilter {
  kind: TrainingKind;
  /** Free text, matched case-insensitively against title, summary and tags. */
  query: string;
  /** Selected tag chips. A training matches when it has at least one of them. Empty = no tag filter. */
  tags: readonly string[];
}

/** Filters trainings by kind, search text and tag chips. Keeps the input order. */
export function filterTrainings(list: readonly Training[], filter: TrainingFilter): Training[] {
  const q = filter.query.trim().toLowerCase();
  return list.filter((t) => {
    if (t.kind !== filter.kind) return false;
    if (filter.tags.length > 0 && !t.tags.some((tag) => filter.tags.includes(tag))) return false;
    if (q === "") return true;
    return t.title.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q));
  });
}

/** Sorted unique tags across trainings of one kind. */
export function trainingTags(list: readonly Training[], kind: TrainingKind): string[] {
  const set = new Set<string>();
  for (const t of list) if (t.kind === kind) for (const tag of t.tags) set.add(tag);
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Share of a training finished, 0..1. A completed training is always 1. */
export function trainingProgressRatio(lessonCount: number, progress: TrainingProgress | undefined): number {
  if (!progress) return 0;
  if (progress.completed) return 1;
  if (lessonCount <= 0) return 0;
  return Math.min(1, Math.max(0, progress.lessonIndex / lessonCount));
}

export function clampLessonIndex(index: number, lessonCount: number): number {
  if (lessonCount <= 0 || !Number.isFinite(index)) return 0;
  return Math.min(lessonCount - 1, Math.max(0, Math.trunc(index)));
}

/** Plain text for speech: drops Markdown syntax and keeps the words. */
export function stripMarkdown(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/(\*\*|__|\*|_)(.*?)\1/g, "$2")
    .replace(/\s+/g, " ")
    .trim();
}

// Read-aloud speed. Stored under this key in localStorage.
export const SPEED_STORAGE_KEY = "pw.training.speed";
export const SPEEDS = [1, 1.5, 2] as const;
export type Speed = (typeof SPEEDS)[number];

export function parseSpeed(raw: string | null | undefined): Speed {
  const n = Number(raw);
  return (SPEEDS as readonly number[]).includes(n) ? (n as Speed) : 1;
}

export function readStoredSpeed(): Speed {
  try {
    return parseSpeed(localStorage.getItem(SPEED_STORAGE_KEY));
  } catch {
    return 1;
  }
}

export function writeStoredSpeed(speed: Speed): void {
  try {
    localStorage.setItem(SPEED_STORAGE_KEY, String(speed));
  } catch {
    // Storage can be blocked. The speed still applies for this session.
  }
}

// ───────────────────────────── jobs ─────────────────────────────

/** A learner can apply when their level reaches the job's minimum. */
export function jobEligible(job: Pick<Job, "minLevel">, level: number): boolean {
  return level >= job.minLevel;
}

export interface JobFilter {
  /** "all" or a career id. */
  careerId: string;
  remoteOnly: boolean;
  eligibleOnly: boolean;
}

export function filterJobs(jobs: readonly Job[], filter: JobFilter, level: number): Job[] {
  return jobs.filter((job) => {
    if (filter.careerId !== "all" && job.careerId !== filter.careerId) return false;
    if (filter.remoteOnly && !job.remote) return false;
    if (filter.eligibleOnly && !jobEligible(job, level)) return false;
    return true;
  });
}

/** Two-letter tile text from a company name, e.g. "Lanternfold Labs" becomes "LL". */
export function companyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Required-field validation for an application. Returns an error message keyed by field key.
 * Empty object means the form is valid. Optional fields are only checked when filled in.
 */
export function validateAnswers(fields: readonly JobApplyField[], answers: Readonly<Record<string, string>>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = (answers[field.key] ?? "").trim();
    if (value === "") {
      if (field.required) errors[field.key] = `${field.label} is required.`;
      continue;
    }
    if (field.type === "email" && !isValidEmail(value)) errors[field.key] = "Enter an email address like name@example.com.";
    if (field.type === "url" && !isValidUrl(value)) errors[field.key] = "Enter a full link starting with https://";
    if (field.type === "select" && field.options && !field.options.includes(value)) errors[field.key] = "Choose one of the listed options.";
  }
  return errors;
}

export const APPLY_DISCLAIMER = "Proofwork never submits applications for you. Review everything, then apply on the employer's site.";
