import type { Slide } from "@pw/shared";

/** A half-open time range in seconds: [start, end). */
export interface Span {
  start: number;
  end: number;
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const SENTENCE = /[^.!?]+(?:[.!?]+["')\]]*|$)/g;

/** Splits narration into caption sentences. Keeps closing punctuation and collapses whitespace. */
export function splitSentences(text: string): string[] {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat === "") return [];
  return (flat.match(SENTENCE) ?? []).map((s) => s.trim()).filter((s) => s.length > 0);
}

/**
 * Divides `totalSec` into contiguous spans, each sized by its weight. Zero or invalid weights
 * fall back to equal shares. The last span always ends exactly at `totalSec`.
 */
export function weightedSpans(weights: readonly number[], totalSec: number): Span[] {
  if (weights.length === 0) return [];
  const clean = weights.map((w) => (Number.isFinite(w) && w > 0 ? w : 0));
  const sum = clean.reduce((a, b) => a + b, 0);
  const shares = sum > 0 ? clean.map((w) => w / sum) : clean.map(() => 1 / clean.length);
  const total = Math.max(0, totalSec);
  let acc = 0;
  return shares.map((share, i) => {
    const start = acc * total;
    acc += share;
    return { start, end: i === shares.length - 1 ? total : acc * total };
  });
}

/** Index of the span containing `timeSec`. Times past the end return the last span. -1 when there are no spans. */
export function activeSpanIndex(spans: readonly Span[], timeSec: number): number {
  if (spans.length === 0) return -1;
  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    if (span && timeSec < span.end) return i;
  }
  return spans.length - 1;
}

/** Caption sentences share the narration time by word count. */
export function sentenceSpans(sentences: readonly string[], totalSec: number): Span[] {
  return weightedSpans(sentences.map(wordCount), totalSec);
}

/** Relative on-screen time of a slide: a base amount plus its words and visual items. */
export function slideWeight(slide: Slide): number {
  let w = 2 + wordCount(slide.heading) + slide.bullets.reduce((n, b) => n + wordCount(b), 0);
  if (slide.metric) w += 2;
  if (slide.quote) w += wordCount(slide.quote.text);
  if (slide.flow) w += slide.flow.length * 2;
  if (slide.chart) w += slide.chart.length * 2;
  return w;
}

/** Slides share the segment's duration by weight. */
export function slideSpans(slides: readonly Slide[], totalSec: number): Span[] {
  return weightedSpans(slides.map(slideWeight), totalSec);
}

/** Fractions (0..1) where slides after the first begin, for timeline tick marks. */
export function boundaryFractions(spans: readonly Span[], totalSec: number): number[] {
  if (totalSec <= 0) return [];
  return spans.slice(1).map((s) => s.start / totalSec);
}

/** Index of the first segment without an accepted note, or `ids.length` when all are accepted. */
export function resumeSegmentIndex(segmentIds: readonly string[], isAccepted: (id: string) => boolean): number {
  const i = segmentIds.findIndex((id) => !isAccepted(id));
  return i === -1 ? segmentIds.length : i;
}

/** Lobby estimate: total narration minutes, rounded up, never below one minute. */
export function estimateKickoffMinutes(segmentDurationsSec: readonly number[]): number {
  const total = segmentDurationsSec.reduce((a, b) => a + b, 0);
  return Math.max(1, Math.ceil(total / 60));
}

export function clamp01(v: number): number {
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
}
