// Minimal .env loader (no dependency). Existing environment variables always win.
import { existsSync, readFileSync } from "node:fs";

export function loadDotEnv(path: string): void {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim().replace(/^export\s+/, "");
    let value = line.slice(eq + 1).trim();
    const quoted = (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"));
    if (quoted) value = value.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
