import { describe, expect, it } from "vitest";
import type { FtuxView } from "@pw/shared";
import { chatPlaceholder } from "./ChatStep";
import { matchPercent, recColor, splitRecommendations } from "./RecommendStep";
import { roadmapPath } from "./RoadmapStep";

type Rec = FtuxView["recommendations"][number];
const rec = (over: Partial<Rec> & Pick<Rec, "careerId">): Rec => ({ title: "T", reason: "", match: 80, ...over });

describe("recommendations", () => {
  it("features the custom path first and keeps the ready-made ones in order", () => {
    const recs = [rec({ careerId: "custom", kind: "custom" }), rec({ careerId: "a", kind: "authored" }), rec({ careerId: "b" })];
    const { custom, ready } = splitRecommendations(recs);
    expect(custom?.careerId).toBe("custom");
    expect(ready.map((r) => r.careerId)).toEqual(["a", "b"]);
  });

  it("has no custom card when the server sends only ready-made paths", () => {
    const { custom, ready } = splitRecommendations([rec({ careerId: "a", kind: "authored" })]);
    expect(custom).toBeNull();
    expect(ready).toHaveLength(1);
  });

  it("uses the server colour, or the accent when it is missing", () => {
    expect(recColor(rec({ careerId: "a", color: "#F2A33A" }))).toBe("#F2A33A");
    expect(recColor(rec({ careerId: "a", color: "  " }))).toBe("var(--color-accent)");
    expect(recColor(rec({ careerId: "a" }))).toBe("var(--color-accent)");
  });

  it("clamps match percentages", () => {
    expect(matchPercent(132)).toBe(100);
    expect(matchPercent(-4)).toBe(0);
    expect(matchPercent(Number.NaN)).toBe(0);
    expect(matchPercent(71.6)).toBe(72);
  });
});

describe("roadmap path", () => {
  const base: FtuxView = {
    sessionId: "s",
    step: "roadmap",
    prompt: "",
    chips: [],
    messages: [],
    board: {},
    recommendations: [rec({ careerId: "custom", title: "Robotics Engineer", color: "#3DD68C", kind: "custom" })],
    roadmap: { careerId: "custom", scenarios: [] },
    claim: null,
  };

  it("takes the title and colour of the roadmap's recommendation", () => {
    expect(roadmapPath(base)).toEqual({ title: "Robotics Engineer", color: "#3DD68C" });
  });

  it("is null when there is no roadmap or no matching recommendation", () => {
    expect(roadmapPath({ ...base, roadmap: null })).toBeNull();
    expect(roadmapPath({ ...base, roadmap: { careerId: "other", scenarios: [] } })).toBeNull();
  });
});

describe("chat placeholder", () => {
  it("invites any job title on the role question", () => {
    expect(chatPlaceholder("What role would you like to work towards?")).toBe("Type any job title…");
  });

  it("uses a plain prompt for other questions", () => {
    expect(chatPlaceholder("Which city would you like to work in?")).toBe("Type your answer…");
  });
});
