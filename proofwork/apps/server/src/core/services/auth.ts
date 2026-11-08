// Sessions (HS256 JWT via jose), local email login and the desktop hand-off URL.
import { PLANS, type AuthResponse, type User } from "@pw/shared";
import { SignJWT, jwtVerify } from "jose";
import type { Core } from "../types.ts";
import { addDaysIso } from "../util.ts";
import { findUser, findUserByEmail, createUser, saveUser } from "./users.ts";
import { grant } from "./credits.ts";
import { notify } from "./notifications.ts";

const TOKEN_TTL = "30d";
const DEV_SECRET = "change-me-dev-secret";

export function jwtSecretFromEnv(): Uint8Array {
  return new TextEncoder().encode(process.env.PW_JWT_SECRET || DEV_SECRET);
}

export function issueToken(core: Core, userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(core.jwtSecret);
}

/** Returns the user id for a valid token whose user still exists, else null. Never logs the token. */
export async function userIdFromToken(core: Core, token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, core.jwtSecret, { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    return findUser(core.db, payload.sub) ? payload.sub : null;
  } catch {
    return null;
  }
}

/** "ada.lovelace@x.com" -> "Ada.lovelace". */
export function defaultName(email: string): string {
  const local = email.split("@")[0] ?? "";
  return local.charAt(0).toUpperCase() + local.slice(1) || "Learner";
}

export async function login(core: Core, input: { email: string; name?: string }): Promise<AuthResponse> {
  const email = input.email;
  let user: User | null = findUserByEmail(core.db, email);
  if (!user) {
    user = createUser(core.db, { email, name: input.name || defaultName(email) });
    const starter = PLANS.find((p) => p.id === "free")?.credits ?? 0;
    grant(core, user.id, starter, "Starter credits", addDaysIso(user.createdAt, 30));
    notify(core, user.id, {
      category: "product",
      title: "Welcome to Proofwork",
      body: "Your Starter credits are ready. Pick a career and start your first project.",
    });
  } else if (input.name && input.name !== user.name) {
    user.name = input.name;
    saveUser(core.db, user);
  }
  return { token: await issueToken(core, user.id), user };
}

/** The URL the desktop opens in the system browser to start the hand-off. */
export function desktopAuthUrl(origin: string, state: string): string {
  return `${origin}/api/auth/web?state=${encodeURIComponent(state)}`;
}
