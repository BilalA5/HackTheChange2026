// Account: profile patch, deletion (every row for the user) and export.
import { unlinkSync } from "node:fs";
import { join } from "node:path";
import type { User } from "@pw/shared";
import { all, run, tx, USER_OWNED_TABLES } from "../db.ts";
import { badRequest } from "../errors.ts";
import type { Core } from "../types.ts";
import { asObject, optStr, reqStr } from "../validate.ts";
import { contentFor, invalidateContent } from "../user-content.ts";
import { addRecommendedTrainings } from "./trainings.ts";
import { mergeSettings, mergeVision, requireUser, saveUser } from "./users.ts";

export function getMe(core: Core, userId: string): User {
  return requireUser(core.db, userId);
}

export function updateMe(core: Core, userId: string, body: unknown): User {
  const o = asObject(body);
  const user = requireUser(core.db, userId);
  const name = optStr(o, "name", { max: 80 });
  if (name !== undefined) {
    if (!name) throw badRequest("name cannot be empty.");
    user.name = name;
  }
  if (o.careerId !== undefined) {
    const careerId = reqStr(o, "careerId", { max: 128 });
    if (!contentFor(core, userId).getCareer(careerId)) throw badRequest("Unknown careerId.");
    if (careerId !== user.careerId) {
      user.careerId = careerId;
      addRecommendedTrainings(core, userId, careerId);
    }
  }
  if (o.vision !== undefined) user.vision = mergeVision(user.vision, o.vision);
  if (o.settings !== undefined) user.settings = mergeSettings(user.settings, o.settings);
  saveUser(core.db, user);
  return user;
}

function removeFiles(core: Core, userId: string): void {
  const uploads = all<{ stored_name: string }>(core.db, "SELECT stored_name FROM uploads WHERE user_id = ?", [userId]);
  for (const row of uploads) removeIfPresent(join(core.paths.uploadsDir, row.stored_name));
  const shots = all<{ screenshot_file: string | null }>(core.db, "SELECT screenshot_file FROM bug_reports WHERE user_id = ?", [userId]);
  for (const row of shots) if (row.screenshot_file) removeIfPresent(join(core.paths.screenshotsDir, row.screenshot_file));
}

function removeIfPresent(path: string): void {
  try {
    unlinkSync(path);
  } catch {
    // Already gone; nothing to clean up.
  }
}

export function deleteMe(core: Core, userId: string): { ok: true } {
  requireUser(core.db, userId);
  removeFiles(core, userId);
  tx(core.db, () => {
    for (const table of USER_OWNED_TABLES) run(core.db, `DELETE FROM ${table} WHERE user_id = ?`, [userId]);
    run(core.db, "DELETE FROM users WHERE id = ?", [userId]);
  });
  invalidateContent(core, userId);
  return { ok: true };
}

const JSON_COLUMNS = ["data", "view", "memory", "request"];

export function exportMe(core: Core, userId: string): Record<string, unknown> {
  const user = requireUser(core.db, userId);
  const tables: Record<string, unknown[]> = {};
  for (const table of USER_OWNED_TABLES) {
    tables[table] = all<Record<string, unknown>>(core.db, `SELECT * FROM ${table} WHERE user_id = ?`, [userId]).map((row) => {
      const out: Record<string, unknown> = { ...row };
      for (const column of JSON_COLUMNS) {
        const value = out[column];
        if (typeof value === "string") out[column] = JSON.parse(value) as unknown;
      }
      return out;
    });
  }
  return { exportedAt: new Date().toISOString(), user, tables };
}

