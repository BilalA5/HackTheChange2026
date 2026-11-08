// Session storage. The session is JSON encrypted with safeStorage (Keychain on mac); plain JSON is the logged fallback.
import { safeStorage } from "electron";
import fs from "node:fs";
import path from "node:path";
import type { StoredSession, User } from "@pw/shared";
import { log } from "../log.ts";

type Listener = (session: StoredSession | null) => void;
type OnDisk = { v: 1; mode: "safeStorage"; data: string } | { v: 1; mode: "plain"; session: StoredSession };

export function isStoredSession(value: unknown): value is StoredSession {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const user = v.user as Partial<User> | undefined;
  return (
    typeof v.token === "string" &&
    v.token.length > 0 &&
    v.token.length < 8192 &&
    typeof user === "object" &&
    user !== null &&
    typeof user.id === "string"
  );
}

export class AuthStore {
  private cache: StoredSession | null | undefined;
  private listeners = new Set<Listener>();

  constructor(private readonly file: string) {}

  get(): StoredSession | null {
    if (this.cache === undefined) this.cache = this.read();
    return this.cache;
  }

  /** Persists the session and notifies listeners. Returns the storage mode used. */
  set(session: StoredSession): "safeStorage" | "plain" {
    const mode = this.write(session);
    this.cache = session;
    this.emit(session);
    return mode;
  }

  clear(): void {
    try {
      fs.rmSync(this.file, { force: true });
    } catch (err) {
      log.warn(`could not remove auth session file: ${(err as Error).message}`);
    }
    this.cache = null;
    this.emit(null);
  }

  onChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(session: StoredSession | null): void {
    for (const listener of this.listeners) listener(session);
  }

  private read(): StoredSession | null {
    let raw: string;
    try {
      raw = fs.readFileSync(this.file, "utf8");
    } catch {
      return null;
    }
    try {
      const body = JSON.parse(raw) as OnDisk;
      let session: unknown;
      if (body.mode === "safeStorage") {
        if (!safeStorage.isEncryptionAvailable()) {
          log.warn("auth session is encrypted but safeStorage is unavailable; ignoring it");
          return null;
        }
        session = JSON.parse(safeStorage.decryptString(Buffer.from(body.data, "base64")));
      } else {
        session = body.session;
      }
      return isStoredSession(session) ? session : null;
    } catch {
      log.warn("auth session file is unreadable; treating as signed out");
      return null;
    }
  }

  private write(session: StoredSession): "safeStorage" | "plain" {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    let body: OnDisk;
    let mode: "safeStorage" | "plain";
    if (safeStorage.isEncryptionAvailable()) {
      body = { v: 1, mode: "safeStorage", data: safeStorage.encryptString(JSON.stringify(session)).toString("base64") };
      mode = "safeStorage";
    } else {
      log.warn("safeStorage unavailable; storing auth session as plain JSON (fallback)");
      body = { v: 1, mode: "plain", session };
      mode = "plain";
    }
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(body), { mode: 0o600 });
    fs.renameSync(tmp, this.file);
    return mode;
  }
}
