// Small argument validators for IPC handlers. Renderer input is untrusted: every handler validates before use.

export function str(value: unknown, name: string, max = 2000): string {
  if (typeof value !== "string" || value.length > max) throw new Error(`invalid ${name}`);
  return value;
}

export function optStr(value: unknown, name: string, max = 2000): string | undefined {
  return value === undefined || value === null ? undefined : str(value, name, max);
}

export function bool(value: unknown, name: string): boolean {
  if (typeof value !== "boolean") throw new Error(`invalid ${name}`);
  return value;
}

export function num(value: unknown, name: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`invalid ${name}`);
  }
  return value;
}

export function oneOf<T extends string>(value: unknown, allowed: readonly T[], name: string): T {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) throw new Error(`invalid ${name}`);
  return value as T;
}

export function obj(value: unknown, name: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`invalid ${name}`);
  return value as Record<string, unknown>;
}

export function strArray(value: unknown, name: string, maxItems = 200, maxLen = 200): string[] {
  if (!Array.isArray(value) || value.length > maxItems) throw new Error(`invalid ${name}`);
  return value.map((v) => str(v, name, maxLen));
}

/** Only web and mailto links may leave the app. */
export function externalUrl(value: unknown): string {
  const url = str(value, "url", 2048);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("invalid url");
  }
  if (!["http:", "https:", "mailto:"].includes(parsed.protocol)) throw new Error("url scheme not allowed");
  return parsed.href;
}

/** In-app route, e.g. "/objective/abc". */
export function route(value: unknown, name = "route"): string {
  const r = str(value, name, 300);
  if (!r.startsWith("/") || r.startsWith("//")) throw new Error(`invalid ${name}`);
  return r;
}
