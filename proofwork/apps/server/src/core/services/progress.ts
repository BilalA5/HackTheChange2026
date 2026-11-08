// XP events, held XP, activity streaks and the learner progress summary.
import { levelForXp, type Progress, type XpEvent } from "@pw/shared";
import { all, one, run, type Db } from "../db.ts";
import type { Core } from "../types.ts";
import { nowIso, shiftDay, todayUtc, uid } from "../util.ts";
import { completedObjectives } from "./objective-store.ts";

export function recordActivity(db: Db, userId: string): void {
  run(db, "INSERT OR IGNORE INTO activity_days (user_id, day) VALUES (?, ?)", [userId, todayUtc()]);
}

/** Records an XP event. Held events do not count until released; only non-held awards are pushed to the client. */
export function awardXp(core: Core, userId: string, amount: number, reason: string, scenarioId: string | null, held = false): void {
  if (amount <= 0) return;
  run(core.db, "INSERT INTO xp_events (id, user_id, amount, reason, scenario_id, held, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [
    uid(),
    userId,
    amount,
    reason,
    scenarioId,
    held ? 1 : 0,
    nowIso(),
  ]);
  recordActivity(core.db, userId);
  if (!held) {
    const total = totalXp(core.db, userId);
    core.hub.push(userId, { type: "xp", amount, reason, total, level: levelForXp(total).level });
  }
}

/** Marks a scenario's held events as earned. Returns the number of events released. */
export function releaseHeldXp(db: Db, userId: string, scenarioId: string): number {
  return run(db, "UPDATE xp_events SET held = 0 WHERE user_id = ? AND scenario_id = ? AND held = 1", [userId, scenarioId]);
}

export function hasXpReason(db: Db, userId: string, scenarioId: string, reason: string): boolean {
  return one<{ found: number }>(db, "SELECT 1 AS found FROM xp_events WHERE user_id = ? AND scenario_id = ? AND reason = ? LIMIT 1", [
    userId,
    scenarioId,
    reason,
  ]) !== undefined;
}

export function totalXp(db: Db, userId: string): number {
  const row = one<{ total: number }>(db, "SELECT COALESCE(SUM(amount), 0) AS total FROM xp_events WHERE user_id = ? AND held = 0", [userId]);
  return Number(row?.total ?? 0);
}

function heldXp(db: Db, userId: string): number {
  const row = one<{ total: number }>(db, "SELECT COALESCE(SUM(amount), 0) AS total FROM xp_events WHERE user_id = ? AND held = 1", [userId]);
  return Number(row?.total ?? 0);
}

/** Streak over the given UTC days: consecutive days, and the current run ending today (or yesterday). */
export function streakOf(days: string[], today: string): { current: number; best: number } {
  const set = new Set(days);
  let best = 0;
  let streakRun = 0;
  let prev: string | null = null;
  for (const day of [...set].sort()) {
    streakRun = prev !== null && shiftDay(prev, 1) === day ? streakRun + 1 : 1;
    best = Math.max(best, streakRun);
    prev = day;
  }
  let cursor = set.has(today) ? today : shiftDay(today, -1);
  let current = 0;
  while (set.has(cursor)) {
    current++;
    cursor = shiftDay(cursor, -1);
  }
  return { current, best };
}

export function computeProgress(core: Core, userId: string): Progress {
  const xp = totalXp(core.db, userId);
  const level = levelForXp(xp);
  const days = all<{ day: string }>(core.db, "SELECT day FROM activity_days WHERE user_id = ?", [userId]).map((r) => r.day);
  const events = all<{ id: string; amount: number; reason: string; scenario_id: string | null; held: number; created_at: string }>(
    core.db,
    "SELECT id, amount, reason, scenario_id, held, created_at FROM xp_events WHERE user_id = ? ORDER BY rowid DESC LIMIT 50",
    [userId],
  ).map(
    (r): XpEvent => ({
      id: r.id,
      amount: r.amount,
      reason: r.reason,
      scenarioId: r.scenario_id,
      held: r.held === 1,
      createdAt: r.created_at,
    }),
  );
  return {
    xp,
    heldXp: heldXp(core.db, userId),
    level: level.level,
    floor: level.floor,
    nextThreshold: level.nextThreshold,
    xpIntoLevel: level.xpIntoLevel,
    xpToNext: level.xpToNext,
    ratio: level.ratio,
    streak: streakOf(days, todayUtc()),
    completedScenarios: completedObjectives(core.db, userId).length,
    events,
  };
}
