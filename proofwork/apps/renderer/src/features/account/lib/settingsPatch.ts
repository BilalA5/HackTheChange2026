import type { DeepPartial } from "@pw/shared";

type Plain = Record<string, unknown>;

export function isPlainObject(value: unknown): value is Plain {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeValue(base: unknown, patch: unknown): unknown {
  if (patch === undefined) return base;
  if (isPlainObject(base) && isPlainObject(patch)) {
    const out: Plain = { ...base };
    for (const key of Object.keys(patch)) out[key] = mergeValue(base[key], patch[key]);
    return out;
  }
  return patch;
}

/** Returns `base` with `patch` merged in, recursing into objects. Undefined patch values are skipped. Inputs are not mutated. */
export function deepMerge<T>(base: T, patch: DeepPartial<T>): T {
  return mergeValue(base, patch) as T;
}

function diffValue(current: unknown, change: unknown): unknown {
  if (change === undefined) return undefined;
  if (isPlainObject(change)) {
    const out: Plain = {};
    let changed = false;
    for (const key of Object.keys(change)) {
      const d = diffValue(isPlainObject(current) ? current[key] : undefined, change[key]);
      if (d !== undefined) {
        out[key] = d;
        changed = true;
      }
    }
    return changed ? out : undefined;
  }
  return Object.is(current, change) ? undefined : change;
}

/**
 * The smallest DeepPartial that, merged into `current`, changes it. Leaves equal to the current value
 * are dropped, so unchanged settings are never sent. Returns {} when nothing differs.
 */
export function buildSettingsPatch<T>(current: T, changes: DeepPartial<T>): DeepPartial<T> {
  return (diffValue(current, changes) ?? {}) as DeepPartial<T>;
}

export function hasChanges(patch: object): boolean {
  return Object.keys(patch).length > 0;
}
