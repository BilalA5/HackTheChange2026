// Hand-written input validation. Each helper throws a 400 HttpError with a readable message.
import { badRequest } from "./errors.ts";

export type Obj = Record<string, unknown>;

export function isObject(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function asObject(v: unknown, name = "Request body"): Obj {
  if (!isObject(v)) throw badRequest(`${name} must be a JSON object.`);
  return v;
}

interface StrOpts {
  max?: number;
  min?: number;
}

/** Required trimmed string. */
export function reqStr(o: Obj, key: string, opts: StrOpts = {}): string {
  const max = opts.max ?? 2000;
  const min = opts.min ?? 1;
  const v = o[key];
  if (typeof v !== "string") throw badRequest(`${key} must be a string.`);
  const t = v.trim();
  if (t.length < min) throw badRequest(`${key} is required.`);
  if (t.length > max) throw badRequest(`${key} must be at most ${max} characters.`);
  return t;
}

/** Optional trimmed string; null and undefined count as absent. */
export function optStr(o: Obj, key: string, opts: StrOpts = {}): string | undefined {
  if (o[key] === undefined || o[key] === null) return undefined;
  return reqStr(o, key, { ...opts, min: 0 });
}

export function reqNum(o: Obj, key: string, opts: { min?: number; max?: number; integer?: boolean } = {}): number {
  const v = o[key];
  if (typeof v !== "number" || !Number.isFinite(v)) throw badRequest(`${key} must be a number.`);
  if (opts.integer && !Number.isInteger(v)) throw badRequest(`${key} must be an integer.`);
  if (opts.min !== undefined && v < opts.min) throw badRequest(`${key} must be at least ${opts.min}.`);
  if (opts.max !== undefined && v > opts.max) throw badRequest(`${key} must be at most ${opts.max}.`);
  return v;
}

export function reqBool(o: Obj, key: string): boolean {
  const v = o[key];
  if (typeof v !== "boolean") throw badRequest(`${key} must be true or false.`);
  return v;
}

export function reqEnum<T extends string>(o: Obj, key: string, values: readonly T[]): T {
  const v = o[key];
  if (typeof v !== "string" || !(values as readonly string[]).includes(v)) {
    throw badRequest(`${key} must be one of: ${values.join(", ")}.`);
  }
  return v as T;
}

export function reqArray(o: Obj, key: string, opts: { min?: number; max: number }): unknown[] {
  const v = o[key];
  if (!Array.isArray(v)) throw badRequest(`${key} must be an array.`);
  if (v.length < (opts.min ?? 0)) throw badRequest(`${key} needs at least ${opts.min} item(s).`);
  if (v.length > opts.max) throw badRequest(`${key} can hold at most ${opts.max} items.`);
  return v;
}

export function isEmail(v: string): boolean {
  return v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
