import { newUuid } from "@/lib/uuid";
import type { DeckSource, OutlineSlide } from "./types";

/** Splits prose into at most `max` sentence-like fragments. Empty input gives an empty list. */
export function summariseSentences(text: string, max = 2): string[] {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return parts.slice(0, max);
}

/**
 * Default five-slide outline: Title, Problem, What I built, Results, Next steps.
 * Every bullet is editable afterwards, so the copy stays plain and factual.
 */
export function buildDefaultSlides(src: DeckSource, makeId: () => string = newUuid): OutlineSlide[] {
  const problem = summariseSentences(src.problemStatement, 2);
  const built = src.agreedRequirements.filter((r) => r.trim().length > 0);
  const results = src.deliverables.filter((d) => d.trim().length > 0);

  return [
    { id: makeId(), heading: src.scenarioTitle, bullets: [src.stageTitle] },
    { id: makeId(), heading: "Problem", bullets: problem.length > 0 ? problem : ["What problem this solves"] },
    { id: makeId(), heading: "What I built", bullets: built.length > 0 ? built : ["What I built and why"] },
    { id: makeId(), heading: "Results", bullets: results.length > 0 ? results : ["What the result looks like"] },
    { id: makeId(), heading: "Next steps", bullets: ["What I would improve next", "Who needs to act on this"] },
  ];
}

/** Keeps a deck to at least one slide and never empties the outline. */
export function canRemoveSlide(count: number): boolean {
  return count > 1;
}

/** Slide counter text, 1-based. */
export function slideCounter(index: number, total: number): string {
  return `${Math.min(index + 1, total)} / ${total}`;
}

/** mm:ss clock for a number of seconds. */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}

/** Target range for a presentation, in seconds. */
export const TARGET_MIN_SEC = 4 * 60;
export const TARGET_MAX_SEC = 8 * 60;

/** Where the elapsed time sits against the 4-8 minute target. */
export function targetState(elapsedSec: number): "short" | "in_range" | "long" {
  if (elapsedSec < TARGET_MIN_SEC) return "short";
  if (elapsedSec <= TARGET_MAX_SEC) return "in_range";
  return "long";
}

/** Joins transcript pieces with single spaces, trimming empties. */
export function joinTranscript(prev: string, next: string): string {
  const a = prev.trim();
  const b = next.trim();
  if (!a) return b;
  if (!b) return a;
  return `${a} ${b}`;
}
