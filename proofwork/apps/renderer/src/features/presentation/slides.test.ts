import { describe, expect, it } from "vitest";
import { buildDefaultSlides, canRemoveSlide, formatDuration, joinTranscript, slideCounter, summariseSentences, targetState } from "./slides";
import type { DeckSource } from "./types";

const src: DeckSource = {
  scenarioTitle: "Ship a Ticket-Routing Agent for Kettle Commerce",
  stageTitle: "Present the routing agent",
  problemStatement: "Support tickets wait two days for triage. Most go to the wrong queue. Agents lose time re-routing them.",
  agreedRequirements: ["Route tickets by intent", "Escalate refunds over 200 USD"],
  deliverables: ["Routing service", "Evaluation report"],
};

let n = 0;
const makeId = () => `id-${++n}`;

describe("buildDefaultSlides", () => {
  it("produces the five default slides in order", () => {
    const deck = buildDefaultSlides(src, makeId);
    expect(deck.map((s) => s.heading)).toEqual(["Ship a Ticket-Routing Agent for Kettle Commerce", "Problem", "What I built", "Results", "Next steps"]);
  });

  it("uses the scenario title on the title slide", () => {
    expect(buildDefaultSlides(src, makeId)[0].heading).toBe(src.scenarioTitle);
  });

  it("summarises the problem to at most two sentences", () => {
    const problem = buildDefaultSlides(src, makeId)[1].bullets;
    expect(problem).toEqual(["Support tickets wait two days for triage.", "Most go to the wrong queue."]);
  });

  it("lists agreed requirements and deliverables", () => {
    const deck = buildDefaultSlides(src, makeId);
    expect(deck[2].bullets).toEqual(src.agreedRequirements);
    expect(deck[3].bullets).toEqual(src.deliverables);
  });

  it("gives every slide a unique id from the id maker", () => {
    const deck = buildDefaultSlides(src, makeId);
    expect(new Set(deck.map((s) => s.id)).size).toBe(deck.length);
  });

  it("falls back to prompts when there is nothing to show", () => {
    const deck = buildDefaultSlides(
      { ...src, problemStatement: "", agreedRequirements: [], deliverables: [] },
      makeId,
    );
    expect(deck[1].bullets).toEqual(["What problem this solves"]);
    expect(deck[2].bullets).toEqual(["What I built and why"]);
    expect(deck[3].bullets).toEqual(["What the result looks like"]);
  });
});

describe("summariseSentences", () => {
  it("returns nothing for blank text", () => {
    expect(summariseSentences("   ")).toEqual([]);
  });

  it("keeps the limit", () => {
    expect(summariseSentences("A. B! C?", 2)).toEqual(["A.", "B!"]);
  });
});

describe("deck helpers", () => {
  it("never removes the last slide", () => {
    expect(canRemoveSlide(1)).toBe(false);
    expect(canRemoveSlide(2)).toBe(true);
  });

  it("formats the slide counter 1-based and clamped", () => {
    expect(slideCounter(0, 5)).toBe("1 / 5");
    expect(slideCounter(9, 5)).toBe("5 / 5");
  });
});

describe("timing", () => {
  it("formats mm:ss", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(125.9)).toBe("02:05");
    expect(formatDuration(-3)).toBe("00:00");
  });

  it("marks the 4-8 minute target range", () => {
    expect(targetState(239)).toBe("short");
    expect(targetState(240)).toBe("in_range");
    expect(targetState(480)).toBe("in_range");
    expect(targetState(481)).toBe("long");
  });
});

describe("joinTranscript", () => {
  it("joins with a single space and skips empties", () => {
    expect(joinTranscript("", " hello ")).toBe("hello");
    expect(joinTranscript("hello", "")).toBe("hello");
    expect(joinTranscript("one", "two")).toBe("one two");
  });
});
