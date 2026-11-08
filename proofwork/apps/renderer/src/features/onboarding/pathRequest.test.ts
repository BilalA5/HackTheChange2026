import { describe, expect, it } from "vitest";
import { emptyPathDraft, pathDraftFromVision, pathRequestFromDraft } from "./pathRequest";

describe("path request", () => {
  it("needs a target role", () => {
    expect(pathRequestFromDraft(emptyPathDraft())).toBeNull();
    expect(pathRequestFromDraft({ ...emptyPathDraft(), targetRole: "   " })).toBeNull();
  });

  it("trims values and drops blank optional fields", () => {
    const req = pathRequestFromDraft({ ...emptyPathDraft(), targetRole: " Robotics engineer ", level: "Junior", location: "  ", why: " Love motors " });
    expect(req).toEqual({ targetRole: "Robotics engineer", level: "Junior", why: "Love motors" });
  });

  it("prefills the draft from the vision board", () => {
    const draft = pathDraftFromVision({ targetRole: "Data Analyst", level: "Junior", background: "Statistics degree" });
    expect(draft.targetRole).toBe("Data Analyst");
    expect(draft.level).toBe("Junior");
    expect(draft.background).toBe("Statistics degree");
    expect(draft.timeline).toBe("");
    expect(pathDraftFromVision(null)).toEqual(emptyPathDraft());
  });
});
