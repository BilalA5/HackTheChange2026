// Stable per-install device id (used by the notifications socket). Stored in userData, never sent anywhere else.
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export function loadOrCreateDeviceId(userData: string): string {
  const file = path.join(userData, "device-id");
  try {
    const existing = fs.readFileSync(file, "utf8").trim();
    if (/^[A-Za-z0-9-]{8,64}$/.test(existing)) return existing;
  } catch {
    // first run
  }
  const id = randomUUID();
  fs.mkdirSync(userData, { recursive: true });
  fs.writeFileSync(file, id, { mode: 0o600 });
  return id;
}
