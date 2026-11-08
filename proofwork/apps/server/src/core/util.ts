import { randomUUID } from "node:crypto";

export const uid = (): string => randomUUID();
export const nowIso = (): string => new Date().toISOString();
/** UTC calendar day, YYYY-MM-DD. */
export const todayUtc = (at: Date = new Date()): string => at.toISOString().slice(0, 10);
export const addDaysIso = (base: string, days: number): string =>
  new Date(Date.parse(base) + days * 86_400_000).toISOString();
export const shiftDay = (day: string, delta: number): string =>
  new Date(Date.parse(`${day}T00:00:00Z`) + delta * 86_400_000).toISOString().slice(0, 10);
export const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

const chains = new Map<string, Promise<unknown>>();

/** Serialises async work per key (used so AI calls cannot interleave writes to one objective). */
export function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = chains.get(key) ?? Promise.resolve();
  const run = prev.then(() => fn());
  const tail = run.catch(() => undefined);
  chains.set(key, tail);
  void tail.then(() => {
    if (chains.get(key) === tail) chains.delete(key);
  });
  return run;
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
