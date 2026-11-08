import { describe, expect, it } from "vitest";
import { buildSettingsPatch, deepMerge, hasChanges } from "./settingsPatch";

interface Sample {
  theme: "system" | "light" | "dark";
  sounds: { enabled: boolean; volume: number };
  notifications: { progress: boolean; billing: boolean; osDelivery: boolean };
}

const base: Sample = {
  theme: "system",
  sounds: { enabled: true, volume: 0.5 },
  notifications: { progress: true, billing: true, osDelivery: false },
};

describe("deepMerge", () => {
  it("merges nested keys and keeps siblings", () => {
    const next = deepMerge(base, { sounds: { volume: 0.8 }, notifications: { osDelivery: true } });
    expect(next.sounds).toEqual({ enabled: true, volume: 0.8 });
    expect(next.notifications).toEqual({ progress: true, billing: true, osDelivery: true });
    expect(next.theme).toBe("system");
  });

  it("does not mutate the base object", () => {
    const snapshot = JSON.parse(JSON.stringify(base)) as Sample;
    deepMerge(base, { sounds: { enabled: false } });
    expect(base).toEqual(snapshot);
  });

  it("skips undefined patch values", () => {
    const next = deepMerge(base, { theme: undefined, sounds: { volume: undefined } });
    expect(next).toEqual(base);
  });
});

describe("buildSettingsPatch", () => {
  it("returns only the leaves that differ", () => {
    const patch = buildSettingsPatch(base, { theme: "dark", sounds: { enabled: true, volume: 0.25 } });
    expect(patch).toEqual({ theme: "dark", sounds: { volume: 0.25 } });
  });

  it("returns an empty object when nothing changed", () => {
    const patch = buildSettingsPatch(base, { theme: "system", notifications: { progress: true } });
    expect(patch).toEqual({});
    expect(hasChanges(patch)).toBe(false);
  });

  it("keeps false values that differ from true", () => {
    const patch = buildSettingsPatch(base, { notifications: { billing: false } });
    expect(patch).toEqual({ notifications: { billing: false } });
    expect(hasChanges(patch)).toBe(true);
  });

  it("produces a patch that, merged, equals the desired state for changed keys", () => {
    const changes = { theme: "light" as const, notifications: { osDelivery: true } };
    const patch = buildSettingsPatch(base, changes);
    expect(deepMerge(base, patch).theme).toBe("light");
    expect(deepMerge(base, patch).notifications.osDelivery).toBe(true);
  });
});
