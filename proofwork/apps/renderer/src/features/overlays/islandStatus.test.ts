import { describe, expect, it } from "vitest";
import { deriveIslandStatus, shouldExpand, STATUS_LABEL, type IslandSignals } from "./islandStatus";

const IDLE: IslandSignals = { started: false, connected: false, listening: false, thinking: false, speaking: false, ended: false };

describe("deriveIslandStatus", () => {
  it("is idle before any session starts", () => {
    expect(deriveIslandStatus(IDLE)).toBe("idle");
  });

  it("is connecting once started but not yet connected", () => {
    expect(deriveIslandStatus({ ...IDLE, started: true })).toBe("connecting");
    expect(deriveIslandStatus({ ...IDLE, started: true, connected: true })).toBe("idle");
  });

  it("maps listening, speaking and thinking", () => {
    const base = { ...IDLE, started: true, connected: true };
    expect(deriveIslandStatus({ ...base, listening: true })).toBe("listening");
    expect(deriveIslandStatus({ ...base, speaking: true })).toBe("speaking");
    expect(deriveIslandStatus({ ...base, thinking: true })).toBe("thinking");
  });

  it("ranks listening above speaking above thinking", () => {
    const all = { ...IDLE, started: true, connected: true, listening: true, speaking: true, thinking: true };
    expect(deriveIslandStatus(all)).toBe("listening");
    expect(deriveIslandStatus({ ...all, listening: false })).toBe("speaking");
    expect(deriveIslandStatus({ ...all, listening: false, speaking: false })).toBe("thinking");
  });

  it("ended wins over everything", () => {
    expect(deriveIslandStatus({ ...IDLE, started: true, listening: true, ended: true })).toBe("ended");
  });
});

describe("island labels and expansion", () => {
  it("uses the spec labels", () => {
    expect(STATUS_LABEL.listening).toBe("Listening…");
    expect(STATUS_LABEL.thinking).toBe("Thinking…");
    expect(STATUS_LABEL.speaking).toBe("Speaking");
    expect(STATUS_LABEL.idle).toBe("Ready");
  });

  it("expands on hover or while speaking only", () => {
    expect(shouldExpand(false, false)).toBe(false);
    expect(shouldExpand(true, false)).toBe(true);
    expect(shouldExpand(false, true)).toBe(true);
  });
});
