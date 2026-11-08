import { describe, expect, it } from "vitest";
import {
  hudNoticeFromPush,
  isStageOverlayPayload,
  parseCoworkCommand,
  parseCoworkState,
  parseHudShow,
  parseRegionSubmit,
} from "./overlayMessages";

const RECT = { x: 0.1, y: 0.2, w: 0.3, h: 0.4 };

describe("payload guard", () => {
  const good = {
    objectiveId: "o1",
    stageId: "s1",
    mode: "plan",
    learnerName: "Sam",
    stageTitle: "Stage",
    scenarioTitle: "Scenario",
    npcName: "Maya",
    npcAvatarSeed: "maya",
  };

  it("accepts a complete stage payload", () => {
    expect(isStageOverlayPayload(good)).toBe(true);
  });

  it("rejects a payload with a missing field or an unknown mode", () => {
    expect(isStageOverlayPayload({ ...good, npcName: undefined })).toBe(false);
    expect(isStageOverlayPayload({ ...good, mode: "sprint" })).toBe(false);
    expect(isStageOverlayPayload(null)).toBe(false);
  });
});

describe("region and cowork parsers", () => {
  it("drops malformed rects from a region submit", () => {
    const parsed = parseRegionSubmit({ regions: [RECT, { x: "bad" }, null], question: "why?" });
    expect(parsed).toEqual({ regions: [RECT], question: "why?" });
    expect(parseRegionSubmit({ regions: [], question: 3 })).toBeNull();
  });

  it("accepts known cowork commands only", () => {
    expect(parseCoworkCommand({ cmd: "start" })).toEqual({ cmd: "start" });
    expect(parseCoworkCommand({ cmd: "im_lost", question: "help", regions: [RECT] })).toEqual({ cmd: "im_lost", question: "help", regions: [RECT] });
    expect(parseCoworkCommand({ cmd: "explode" })).toBeNull();
  });

  it("parses cowork:state with optional fields", () => {
    expect(parseCoworkState({ status: "idle" })).toEqual({ status: "idle" });
    expect(parseCoworkState({ status: "bogus" })).toBeNull();
  });

  it("requires a title for hud:show", () => {
    expect(parseHudShow({ title: "Hi", tone: "xp" })).toEqual({ title: "Hi", tone: "xp" });
    expect(parseHudShow({ tone: "xp" })).toBeNull();
    expect(parseHudShow({ title: "Hi", tone: "loud" })).toEqual({ title: "Hi" });
  });
});

describe("hudNoticeFromPush", () => {
  it("formats an xp push as +N XP · reason", () => {
    expect(hudNoticeFromPush({ type: "xp", amount: 25, reason: "Clear brief" })).toEqual({ title: "+25 XP · Clear brief", tone: "xp" });
  });

  it("falls back to +N XP when there is no reason", () => {
    expect(hudNoticeFromPush({ type: "xp", amount: 5 })).toEqual({ title: "+5 XP", tone: "xp" });
  });

  it("shows the title of a notification push", () => {
    expect(hudNoticeFromPush({ type: "notification", item: { title: "Review ready", body: "Open it" } })).toEqual({
      title: "Review ready",
      tone: "neutral",
      body: "Open it",
    });
  });

  it("ignores other frame types and malformed frames", () => {
    expect(hudNoticeFromPush({ type: "coach_moment", text: "hi" })).toBeNull();
    expect(hudNoticeFromPush({ type: "xp", amount: "lots" })).toBeNull();
    expect(hudNoticeFromPush({ type: "notification", item: {} })).toBeNull();
  });
});
