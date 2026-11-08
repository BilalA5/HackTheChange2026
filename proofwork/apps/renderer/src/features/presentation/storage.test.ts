import { describe, expect, it } from "vitest";
import { readRecordingUrl, recordingStorageKey, storeRecordingUrl } from "./storage";

describe("recording storage", () => {
  it("uses the per-objective key", () => {
    expect(recordingStorageKey("obj-1")).toBe("pw.presentation.obj-1");
  });

  it("round-trips a url and clears it with null", () => {
    storeRecordingUrl("obj-1", "blob:abc");
    expect(readRecordingUrl("obj-1")).toBe("blob:abc");
    storeRecordingUrl("obj-1", null);
    expect(readRecordingUrl("obj-1")).toBeNull();
  });
});
