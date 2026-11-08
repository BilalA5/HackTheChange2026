import { describe, expect, it } from "vitest";
import { parseCameraFraming, parsePresentationPayload, parseRecordBarCommand, parseRecordBarState } from "./overlayLink";

describe("overlay message parsing", () => {
  it("accepts known record bar commands only", () => {
    expect(parseRecordBarCommand({ cmd: "pause" })).toBe("pause");
    expect(parseRecordBarCommand({ cmd: "explode" })).toBeNull();
    expect(parseRecordBarCommand(null)).toBeNull();
  });

  it("parses a record bar state and rejects partial ones", () => {
    const good = { elapsedSec: 12, paused: false, slide: 1, slides: 5, recording: true };
    expect(parseRecordBarState(good)).toEqual(good);
    expect(parseRecordBarState({ ...good, slides: "5" })).toBeNull();
  });

  it("clamps framing scores and rejects unknown reasons", () => {
    expect(parseCameraFraming({ score: 1.4, reason: "ok" })).toEqual({ score: 1, reason: "ok" });
    expect(parseCameraFraming({ score: 0.5, reason: "too_close" })).toBeNull();
  });

  it("reads the presentation payload and tolerates a missing camera id", () => {
    expect(parsePresentationPayload({ objectiveId: "o", stageId: "s", slides: 5 })).toEqual({
      objectiveId: "o",
      stageId: "s",
      slides: 5,
      cameraDeviceId: undefined,
    });
    expect(parsePresentationPayload({ objectiveId: "o" })).toBeNull();
  });
});
