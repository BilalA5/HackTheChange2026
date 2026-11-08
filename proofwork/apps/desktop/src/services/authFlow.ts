// Browser-based login: start on the server, open the system browser, resolve when proofwork://auth/callback returns.
import { randomBytes } from "node:crypto";
import { API_PREFIX, type StoredSession, type User } from "@pw/shared";
import { log, errorMessage } from "../log.ts";
import type { AuthStore } from "./authStore.ts";
import { isStoredSession } from "./authStore.ts";

const LOGIN_TIMEOUT_MS = 5 * 60_000;
const HTTP_TIMEOUT_MS = 15_000;

interface Pending {
  state: string;
  resolve(session: StoredSession): void;
  reject(err: Error): void;
  timer: NodeJS.Timeout;
}

export interface AuthDeps {
  serverUrl: string;
  store: AuthStore;
  openExternal(url: string): Promise<void>;
}

let pending: Pending | null = null;

function settle(p: Pending): void {
  clearTimeout(p.timer);
  if (pending === p) pending = null;
}

export async function startBrowserLogin(deps: AuthDeps): Promise<StoredSession> {
  const state = randomBytes(24).toString("base64url");
  const res = await fetch(`${deps.serverUrl}${API_PREFIX}/auth/desktop/start`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ state }),
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`login could not start (${res.status})`);
  const body = (await res.json()) as { url?: unknown };
  if (typeof body.url !== "string" || !/^https?:\/\//.test(body.url)) throw new Error("login returned no URL");

  if (pending) pending.reject(new Error("login superseded"));
  const session = new Promise<StoredSession>((resolve, reject) => {
    const entry: Pending = {
      state,
      resolve: (s) => {
        settle(entry);
        resolve(s);
      },
      reject: (e) => {
        settle(entry);
        reject(e);
      },
      timer: setTimeout(() => entry.reject(new Error("login timed out")), LOGIN_TIMEOUT_MS),
    };
    pending = entry;
  });

  // If opening the browser fails, the awaited promise below is abandoned; keep its later rejection from going unhandled.
  session.catch(() => undefined);
  try {
    await deps.openExternal(body.url);
  } catch (err) {
    pending?.reject(new Error(errorMessage(err)));
    throw err;
  }
  return session;
}

/** Called by the deep-link handler. The token is never logged. */
export async function handleLoginCallback(deps: AuthDeps, token: string, state: string): Promise<void> {
  const current = pending;
  if (!current || current.state !== state) {
    log.warn("auth callback ignored: no matching login in progress");
    return;
  }
  if (!token || token.length > 8192 || /\s/.test(token)) {
    current.reject(new Error("auth callback carried an invalid token"));
    return;
  }
  try {
    const res = await fetch(`${deps.serverUrl}${API_PREFIX}/me`, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`could not load account (${res.status})`);
    const user = (await res.json()) as User;
    const session = { token, user };
    if (!isStoredSession(session)) throw new Error("account response was not a user");
    deps.store.set(session);
    current.resolve(session);
    log.info("login complete");
  } catch (err) {
    current.reject(new Error(errorMessage(err)));
  }
}
