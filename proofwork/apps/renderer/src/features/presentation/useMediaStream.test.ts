import { describe, expect, it } from "vitest";
import { describeMediaError, groupDevices } from "./useMediaStream";

function named(name: string): Error {
  const e = new Error(name);
  e.name = name;
  return e;
}

describe("describeMediaError", () => {
  it("maps a blocked permission to denied", () => {
    expect(describeMediaError(named("NotAllowedError")).status).toBe("denied");
    expect(describeMediaError(named("SecurityError")).status).toBe("denied");
  });

  it("maps a missing device to not_found", () => {
    expect(describeMediaError(named("NotFoundError")).status).toBe("not_found");
    expect(describeMediaError(named("OverconstrainedError")).status).toBe("not_found");
  });

  it("falls back to a generic error with a retry hint", () => {
    const d = describeMediaError(named("AbortError"));
    expect(d.status).toBe("error");
    expect(d.message).toMatch(/Retry/);
    expect(describeMediaError("boom").status).toBe("error");
  });
});

describe("groupDevices", () => {
  it("splits cameras and mics and numbers unlabelled devices", () => {
    const list = [
      { deviceId: "c1", kind: "videoinput", label: "FaceTime HD" },
      { deviceId: "c2", kind: "videoinput", label: "" },
      { deviceId: "m1", kind: "audioinput", label: "" },
      { deviceId: "s1", kind: "audiooutput", label: "Speakers" },
    ] as unknown as MediaDeviceInfo[];
    expect(groupDevices(list)).toEqual({
      cameras: [
        { deviceId: "c1", label: "FaceTime HD" },
        { deviceId: "c2", label: "Camera 2" },
      ],
      mics: [{ deviceId: "m1", label: "Microphone 1" }],
    });
  });
});
