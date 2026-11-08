// Deterministic randomness for the practice-mode path generator. No Math.random, no clocks.

export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max], inclusive. */
  int(min: number, max: number): number;
  /** Float in [min, max], rounded to `digits` decimals. */
  float(min: number, max: number, digits?: number): number;
  pick<T>(items: readonly T[]): T;
  /** Returns a shuffled copy. */
  shuffle<T>(items: readonly T[]): T[];
  /** n distinct items in random order (n is clamped to the list length). */
  sample<T>(items: readonly T[], n: number): T[];
  chance(p: number): boolean;
}

/** 32-bit FNV-1a with an avalanche finaliser. Stable across runs and platforms. */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** mulberry32 seeded from a string. The same seed always yields the same sequence. */
export function createRng(seed: string): Rng {
  let state = hashString(seed);
  const next = (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1));
  const shuffle = <T>(items: readonly T[]): T[] => {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  return {
    next,
    int,
    float(min, max, digits = 2) {
      const factor = 10 ** digits;
      return Math.round((min + next() * (max - min)) * factor) / factor;
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new Error("pathgen: pick from an empty list");
      return items[Math.floor(next() * items.length)];
    },
    shuffle,
    sample<T>(items: readonly T[], n: number): T[] {
      return shuffle(items).slice(0, Math.max(0, Math.min(n, items.length)));
    },
    chance: (p) => next() < p,
  };
}

/** JSON with sorted keys and undefined values dropped, so equal requests always hash the same. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v ?? null)).join(",")}]`;
  const record = value as Record<string, unknown>;
  const entries = Object.keys(record)
    .sort()
    .filter((k) => record[k] !== undefined)
    .map((k) => `${JSON.stringify(k)}:${stableStringify(record[k])}`);
  return `{${entries.join(",")}}`;
}
