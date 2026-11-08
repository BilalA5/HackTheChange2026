// User rows, settings and vision validation/merging.
import { NOTIFICATION_CATEGORIES, type NotificationCategory, type PlanId, type User, type UserSettings, type VisionBoard } from "@pw/shared";
import { one, run, type Db } from "../db.ts";
import { unauthorized, badRequest } from "../errors.ts";
import { uid, nowIso } from "../util.ts";
import { asObject, isObject, type Obj } from "../validate.ts";

interface UserRow {
  id: string;
  email: string;
  name: string;
  created_at: string;
  career_id: string | null;
  plan: string;
  plan_changed_at: string | null;
  onboarding_complete: number;
  vision: string | null;
  settings: string;
}

const USER_COLUMNS = "id, email, name, created_at, career_id, plan, plan_changed_at, onboarding_complete, vision, settings";

export function defaultSettings(): UserSettings {
  const notifications = Object.fromEntries(NOTIFICATION_CATEGORIES.map((c) => [c, true])) as Record<NotificationCategory, boolean>;
  return {
    launchAtLogin: false,
    menuBarStatus: true,
    theme: "system",
    sounds: { enabled: true, volume: 0.6 },
    notifications: { ...notifications, osDelivery: true },
    voice: { stt: "apple", ttsEnabled: true, ttsRate: 1, ttsNatural: true },
    aiModel: "quality",
    devices: { cameraId: "", micId: "", speakerId: "" },
    privacy: { shareAnalytics: false, storeRecordings: true },
  };
}

/** Fills keys missing from a stored object with defaults, recursively. */
function withDefaults(base: Obj, stored: Obj): Obj {
  const out: Obj = { ...base };
  for (const key of Object.keys(base)) {
    const value = stored[key];
    if (value === undefined) continue;
    const current = base[key];
    out[key] = isObject(current) && isObject(value) ? withDefaults(current, value) : value;
  }
  return out;
}

export function toUser(row: UserRow): User {
  const stored = row.settings ? (JSON.parse(row.settings) as Obj) : {};
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    careerId: row.career_id,
    plan: row.plan as PlanId,
    onboardingComplete: row.onboarding_complete === 1,
    vision: row.vision ? (JSON.parse(row.vision) as VisionBoard) : null,
    settings: withDefaults(defaultSettings() as unknown as Obj, stored) as unknown as UserSettings,
  };
}

export function findUser(db: Db, id: string): User | null {
  const row = one<UserRow>(db, `SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [id]);
  return row ? toUser(row) : null;
}

export function requireUser(db: Db, id: string): User {
  const user = findUser(db, id);
  if (!user) throw unauthorized("Your account no longer exists. Sign in again.");
  return user;
}

export function findUserByEmail(db: Db, email: string): User | null {
  const row = one<UserRow>(db, `SELECT ${USER_COLUMNS} FROM users WHERE email = ?`, [email]);
  return row ? toUser(row) : null;
}

export function createUser(db: Db, input: { email: string; name: string }): User {
  const id = uid();
  run(
    db,
    "INSERT INTO users (id, email, name, created_at, career_id, plan, plan_changed_at, onboarding_complete, vision, settings) VALUES (?, ?, ?, ?, NULL, 'free', NULL, 0, NULL, ?)",
    [id, input.email, input.name, nowIso(), JSON.stringify(defaultSettings())],
  );
  return requireUser(db, id);
}

export function saveUser(db: Db, user: User): void {
  run(db, "UPDATE users SET name = ?, career_id = ?, onboarding_complete = ?, vision = ?, settings = ? WHERE id = ?", [
    user.name,
    user.careerId,
    user.onboardingComplete ? 1 : 0,
    user.vision ? JSON.stringify(user.vision) : null,
    JSON.stringify(user.settings),
    user.id,
  ]);
}

export function setPlan(db: Db, userId: string, plan: PlanId, at: string): void {
  run(db, "UPDATE users SET plan = ?, plan_changed_at = ? WHERE id = ?", [plan, at, userId]);
}

export function planOf(db: Db, userId: string): PlanId {
  const row = one<{ plan: string }>(db, "SELECT plan FROM users WHERE id = ?", [userId]);
  return (row?.plan ?? "free") as PlanId;
}

export function planChangedAt(db: Db, userId: string): string | null {
  const row = one<{ plan_changed_at: string | null }>(db, "SELECT plan_changed_at FROM users WHERE id = ?", [userId]);
  return row?.plan_changed_at ?? null;
}

// ───────────────────────────── settings ─────────────────────────────

const ENUM_SETTINGS: Record<string, readonly string[]> = {
  theme: ["system", "light", "dark"],
  aiModel: ["quality", "fast"],
  "voice.stt": ["apple", "typed"],
};
const RANGE_SETTINGS: Record<string, [number, number]> = {
  "sounds.volume": [0, 1],
  "voice.ttsRate": [0.5, 2],
};

/** Strict deep merge: unknown keys and wrong types are rejected. */
function mergeStrict(base: Obj, patch: Obj, path: string): Obj {
  const out: Obj = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    const where = path ? `${path}.${key}` : key;
    if (!(key in base)) throw badRequest(`Unknown setting ${where}.`);
    if (value === undefined) continue;
    const current = base[key];
    if (isObject(current)) {
      if (!isObject(value)) throw badRequest(`${where} must be an object.`);
      out[key] = mergeStrict(current, value, where);
      continue;
    }
    if (typeof current !== typeof value) throw badRequest(`${where} has the wrong type.`);
    const allowed = ENUM_SETTINGS[where];
    if (allowed && !allowed.includes(String(value))) throw badRequest(`${where} must be one of: ${allowed.join(", ")}.`);
    const range = RANGE_SETTINGS[where];
    if (range && typeof value === "number" && (value < range[0] || value > range[1])) {
      throw badRequest(`${where} must be between ${range[0]} and ${range[1]}.`);
    }
    out[key] = value;
  }
  return out;
}

export function mergeSettings(current: UserSettings, patch: unknown): UserSettings {
  const merged = mergeStrict(current as unknown as Obj, asObject(patch, "settings"), "");
  return merged as unknown as UserSettings;
}

// ───────────────────────────── vision ─────────────────────────────

const VISION_FIELDS = ["targetRole", "level", "industry", "companyType", "location", "timeline", "why", "background", "drawingDataUrl"];

export function emptyVision(): VisionBoard {
  return { targetRole: "", level: "", industry: "", companyType: "", location: "", timeline: "" };
}

export function mergeVision(current: VisionBoard | null, patch: unknown): VisionBoard {
  const fields = asObject(patch, "vision");
  const out: Obj = { ...(current ?? emptyVision()) };
  for (const [key, raw] of Object.entries(fields)) {
    if (!VISION_FIELDS.includes(key)) throw badRequest(`Unknown vision field ${key}.`);
    const value = raw === null ? "" : raw;
    if (typeof value !== "string") throw badRequest(`vision.${key} must be a string.`);
    const max = key === "drawingDataUrl" ? 4_000_000 : 500;
    if (value.length > max) throw badRequest(`vision.${key} is too long.`);
    if (key === "drawingDataUrl" && value !== "" && !value.startsWith("data:image/")) {
      throw badRequest("vision.drawingDataUrl must be an image data URL.");
    }
    if (key === "drawingDataUrl" && value === "") {
      delete out[key];
      continue;
    }
    out[key] = value;
  }
  return out as unknown as VisionBoard;
}
