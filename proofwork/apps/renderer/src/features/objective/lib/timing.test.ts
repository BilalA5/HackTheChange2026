import { describe, expect, it } from "vitest";
import type { Slide } from "@pw/shared";
import {
  activeSpanIndex,
  boundaryFractions,
  resumeSegmentIndex,
  slideSpans,
  splitSentences,
  weightedSpans,
} from "./timing";

describe("splitSentences", () => {
  it("keeps closing punctuation and splits on . ! ?", () => {
    expect(splitSentences("Hello there. How are you? Fine!")).toEqual(["Hello there.", "How are you?", "Fine!"]);
  });

  it("keeps trailing text without punctuation as a sentence", () => {
    expect(splitSentences("  no punctuation here  ")).toEqual(["no punctuation here"]);
  });

  it("collapses whitespace and newlines", () => {
    expect(splitSentences("a.  b\n\nc.")).toEqual(["a.", "b c."]);
  });

  it("returns nothing for empty input", () => {
    expect(splitSentences("")).toEqual([]);
    expect(splitSentences("   \n ")).toEqual([]);
  });
});

describe("weightedSpans", () => {
  it("divides the total by weight with contiguous spans", () => {
    expect(weightedSpans([1, 1, 2], 8)).toEqual([
      { start: 0, end: 2 },
      { start: 2, end: 4 },
      { start: 4, end: 8 },
    ]);
  });

  it("ends the last span exactly at the total", () => {
    const spans = weightedSpans([3, 7, 11], 37.3);
    expect(spans[spans.length - 1]?.end).toBe(37.3);
  });

  it("falls back to equal shares for zero or invalid weights", () => {
    expect(weightedSpans([0, 0], 10)).toEqual([
      { start: 0, end: 5 },
      { start: 5, end: 10 },
    ]);
    expect(weightedSpans([Number.NaN, -2], 4)).toEqual([
      { start: 0, end: 2 },
      { start: 2, end: 4 },
    ]);
  });

  it("returns no spans for no weights", () => {
    expect(weightedSpans([], 10)).toEqual([]);
  });
});

describe("slide timing", () => {
  const slides: Slide[] = [
    { heading: "Problem", bullets: ["Routing is slow", "Tickets pile up"] },
    { heading: "Metric", bullets: [], visual: "metric", metric: { label: "Backlog", value: "4,200" } },
    { heading: "Flow", bullets: ["Steps"], visual: "flow", flow: ["Intake", "Route", "Close"] },
  ];

  it("covers the whole segment without gaps", () => {
    const spans = slideSpans(slides, 60);
    expect(spans).toHaveLength(3);
    expect(spans[0]?.start).toBe(0);
    for (let i = 1; i < spans.length; i++) {
      expect(spans[i]?.start).toBeCloseTo(spans[i - 1]?.end ?? -1, 10);
    }
    expect(spans[2]?.end).toBe(60);
  });

  it("finds the active slide at a given time", () => {
    const spans = slideSpans(slides, 60);
    const first = spans[0]?.end ?? 0;
    expect(activeSpanIndex(spans, 0)).toBe(0);
    expect(activeSpanIndex(spans, first - 0.01)).toBe(0);
    expect(activeSpanIndex(spans, first)).toBe(1);
    expect(activeSpanIndex(spans, 59.9)).toBe(2);
    expect(activeSpanIndex(spans, 500)).toBe(2);
  });

  it("returns -1 when there are no spans", () => {
    expect(activeSpanIndex([], 3)).toBe(-1);
  });

  it("gives tick fractions for every slide after the first", () => {
    const spans = weightedSpans([1, 1, 2], 8);
    expect(boundaryFractions(spans, 8)).toEqual([0.25, 0.5]);
    expect(boundaryFractions(spans, 0)).toEqual([]);
  });
});

describe("resumeSegmentIndex", () => {
  const ids = ["problem", "outcome", "process"];

  it("starts at the first segment when nothing is accepted", () => {
    expect(resumeSegmentIndex(ids, () => false)).toBe(0);
  });

  it("resumes at the first segment without an accepted note", () => {
    expect(resumeSegmentIndex(ids, (id) => id === "problem")).toBe(1);
    expect(resumeSegmentIndex(ids, (id) => id === "outcome")).toBe(0);
  });

  it("returns the count when every note is accepted", () => {
    expect(resumeSegmentIndex(ids, () => true)).toBe(3);
  });

  it("returns zero for an empty kickoff", () => {
    expect(resumeSegmentIndex([], () => true)).toBe(0);
  });
});
