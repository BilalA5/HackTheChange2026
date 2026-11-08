import { describe, expect, it } from "vitest";
import type { Job, ObjectivePhase, ScenarioCard } from "@pw/shared";
import { scenarios } from "@pw/content";
import {
  careerScenarios,
  cycleIndex,
  defaultScenarioId,
  draftFromVision,
  eligibleJobCount,
  emptyVisionDraft,
  formatDuration,
  isJobPortalUnlocked,
  isVisionDraftDirty,
  mergeScenarioCards,
  placeholderCard,
  previousScenario,
  relativeTime,
  routeForObjective,
  visionPatchFromDraft,
} from "./model";

function card(over: Partial<ScenarioCard> & Pick<ScenarioCard, "id">): ScenarioCard {
  const base = scenarios[0];
  const c = placeholderCard(base, { id: "c", name: "Co", industry: "", tagline: "", color: "#000000", glyph: "C", building: "tower" }, {
    id: "n",
    name: "N",
    role: "R",
    companyId: "c",
    personality: "",
    voice: { rate: 1, pitch: 1 },
    avatarSeed: "n",
  });
  return { ...c, ...over, careerId: over.careerId ?? "career-a" };
}

describe("routeForObjective", () => {
  const cases: [ObjectivePhase, string | null, string][] = [
    ["brief", null, "/objective/o1"],
    ["kickoff", null, "/objective/o1"],
    ["pou", null, "/objective/o1"],
    ["stages", "s1", "/objective/o1/stage/s1"],
    ["stages", null, "/objective/o1"],
    ["complete", null, "/objective/o1/review"],
  ];
  it.each(cases)("phase %s routes to %s", (phase, stage, expected) => {
    expect(routeForObjective({ id: "o1", phase, currentStageId: stage })).toBe(expected);
  });

  it("encodes ids", () => {
    expect(routeForObjective({ id: "a/b", phase: "brief", currentStageId: null })).toBe("/objective/a%2Fb");
  });
});

describe("selection and ordering", () => {
  const list = [
    card({ id: "a", order: 1, status: "completed" }),
    card({ id: "b", order: 2, status: "available" }),
    card({ id: "c", order: 3, status: "in_progress" }),
    card({ id: "d", order: 4, status: "locked" }),
  ];

  it("defaults to the first in-progress project, then the first available", () => {
    expect(defaultScenarioId(list)).toBe("c");
    expect(defaultScenarioId(list.filter((c) => c.id !== "c"))).toBe("b");
    expect(defaultScenarioId([])).toBeNull();
  });

  it("finds the previous project in the same career", () => {
    expect(previousScenario(list, list[3])?.id).toBe("c");
    expect(previousScenario(list, list[0])).toBeNull();
  });

  it("filters and sorts a career's cards", () => {
    const mixed = [card({ id: "x", order: 2, careerId: "k" }), card({ id: "y", order: 1, careerId: "k" }), card({ id: "z", order: 1, careerId: "other" })];
    expect(careerScenarios(mixed, "k").map((c) => c.id)).toEqual(["y", "x"]);
    expect(careerScenarios(mixed, null)).toEqual([]);
  });

  it("cycles through indexes and wraps, starting from the ends when not in the list", () => {
    expect(cycleIndex(0, 1, 3)).toBe(1);
    expect(cycleIndex(2, 1, 3)).toBe(0);
    expect(cycleIndex(0, -1, 3)).toBe(2);
    expect(cycleIndex(-1, 1, 3)).toBe(0);
    expect(cycleIndex(-1, -1, 3)).toBe(2);
    expect(cycleIndex(0, 1, 0)).toBe(-1);
  });
});

describe("mergeScenarioCards", () => {
  it("covers every content scenario and prefers API cards", () => {
    const apiCard = card({ id: scenarios[0].id, status: "in_progress", objectiveId: "o9", careerId: scenarios[0].careerId });
    const merged = mergeScenarioCards([apiCard]);
    expect(merged).toHaveLength(scenarios.length);
    expect(merged.find((c) => c.id === scenarios[0].id)).toBe(apiCard);
    const other = merged.find((c) => c.careerId !== scenarios[0].careerId);
    expect(other?.status).toBe("locked");
    expect(other?.objectiveId).toBeNull();
  });
});

describe("formatting", () => {
  it("formats durations", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(180)).toBe("3 hr");
    expect(formatDuration(150)).toBe("2.5 hr");
  });

  it("formats relative times", () => {
    const now = Date.parse("2026-11-07T12:00:00Z");
    expect(relativeTime("2026-11-07T11:59:30Z", now)).toBe("just now");
    expect(relativeTime("2026-11-07T11:40:00Z", now)).toBe("20 min ago");
    expect(relativeTime("2026-11-07T09:00:00Z", now)).toBe("3 hr ago");
    expect(relativeTime("2026-11-06T12:00:00Z", now)).toBe("1 day ago");
    expect(relativeTime("2026-11-04T12:00:00Z", now)).toBe("3 days ago");
    expect(relativeTime("nope", now)).toBe("");
  });
});

describe("jobs and unlocks", () => {
  it("counts jobs by minimum level", () => {
    const jobs = [{ minLevel: 0 }, { minLevel: 2 }, { minLevel: 5 }] as Pick<Job, "minLevel">[];
    expect(eligibleJobCount(jobs, 2)).toBe(2);
    expect(eligibleJobCount(jobs, 0)).toBe(1);
  });

  it("unlocks the job portal after the threshold", () => {
    expect(isJobPortalUnlocked(0)).toBe(false);
    expect(isJobPortalUnlocked(1)).toBe(true);
  });
});

describe("vision draft", () => {
  it("trims values and drops an empty why", () => {
    const d = { ...emptyVisionDraft(), targetRole: "  AI Engineer ", why: "   " };
    const patch = visionPatchFromDraft(d);
    expect(patch.targetRole).toBe("AI Engineer");
    expect(patch).not.toHaveProperty("why");
  });

  it("detects dirty drafts", () => {
    const saved = draftFromVision(null);
    expect(isVisionDraftDirty(saved, saved)).toBe(false);
    expect(isVisionDraftDirty({ ...saved, location: "Oslo" }, saved)).toBe(true);
  });
});
