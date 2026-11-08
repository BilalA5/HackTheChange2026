// Objective persistence (one JSON document per objective) and the per-objective mutation lock.
import type { Objective } from "@pw/shared";
import { all, one, run, type Db } from "../db.ts";
import { notFound } from "../errors.ts";
import type { Core } from "../types.ts";
import { nowIso, withLock } from "../util.ts";

interface DataRow {
  data: string;
}

export function findObjective(db: Db, userId: string, id: string): Objective | null {
  const row = one<DataRow>(db, "SELECT data FROM objectives WHERE id = ? AND user_id = ?", [id, userId]);
  return row ? (JSON.parse(row.data) as Objective) : null;
}

export function requireObjective(db: Db, userId: string, id: string): Objective {
  const objective = findObjective(db, userId, id);
  if (!objective) throw notFound("Objective not found.");
  return objective;
}

export function findObjectiveByScenario(db: Db, userId: string, scenarioId: string): Objective | null {
  const row = one<DataRow>(db, "SELECT data FROM objectives WHERE user_id = ? AND scenario_id = ?", [userId, scenarioId]);
  return row ? (JSON.parse(row.data) as Objective) : null;
}

export function listObjectives(db: Db, userId: string): Objective[] {
  return all<DataRow>(db, "SELECT data FROM objectives WHERE user_id = ? ORDER BY created_at", [userId]).map(
    (r) => JSON.parse(r.data) as Objective,
  );
}

export function objectivesByScenario(db: Db, userId: string): Map<string, Objective> {
  return new Map(listObjectives(db, userId).map((o) => [o.scenarioId, o]));
}

export function completedObjectives(db: Db, userId: string): Objective[] {
  return listObjectives(db, userId).filter((o) => o.status === "completed");
}

export function insertObjective(db: Db, userId: string, objective: Objective): void {
  const now = nowIso();
  run(db, "INSERT INTO objectives (id, user_id, scenario_id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)", [
    objective.id,
    userId,
    objective.scenarioId,
    JSON.stringify(objective),
    now,
    now,
  ]);
}

export function saveObjective(db: Db, userId: string, objective: Objective): void {
  run(db, "UPDATE objectives SET data = ?, updated_at = ? WHERE id = ? AND user_id = ?", [
    JSON.stringify(objective),
    nowIso(),
    objective.id,
    userId,
  ]);
}

/**
 * Loads the objective fresh under a per-objective lock, runs fn, and saves only when fn resolves.
 * Throwing from fn leaves the stored objective untouched.
 */
export function mutateObjective<T>(core: Core, userId: string, objectiveId: string, fn: (obj: Objective) => T | Promise<T>): Promise<T> {
  return withLock(`objective:${objectiveId}`, async () => {
    const objective = requireObjective(core.db, userId, objectiveId);
    const result = await fn(objective);
    saveObjective(core.db, userId, objective);
    return result;
  });
}
