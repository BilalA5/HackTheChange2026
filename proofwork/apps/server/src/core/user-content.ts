// Per-learner content: the authored library merged with this learner's own generated paths.
// Generated packs and jobs are visible only to their owner; the merged index is cached per user
// and dropped whenever a path is saved or the account is deleted.
import type { GeneratedPath } from "../contracts.ts";
import { buildContentIndex, type ContentIndex } from "./content.ts";
import { all, one, type Db } from "./db.ts";
import type { Core } from "./types.ts";

export interface GeneratedPathRow {
  id: string;
  user_id: string;
  career_id: string;
  engine: string;
  provider: string;
  request: string;
  data: string;
  created_at: string;
}

const caches = new WeakMap<Core, Map<string, ContentIndex>>();

/** All of one learner's generated paths, oldest first. */
export function generatedPathRows(db: Db, userId: string): GeneratedPathRow[] {
  return all<GeneratedPathRow>(db, "SELECT * FROM generated_paths WHERE user_id = ? ORDER BY created_at, rowid", [userId]);
}

/** The generated path behind one of the learner's careers, or null when the career is authored. */
export function generatedPathFor(db: Db, userId: string, careerId: string): GeneratedPath | null {
  const row = one<{ data: string }>(db, "SELECT data FROM generated_paths WHERE user_id = ? AND career_id = ?", [userId, careerId]);
  return row ? (JSON.parse(row.data) as GeneratedPath) : null;
}

export function hasGeneratedPath(db: Db, userId: string, careerId: string): boolean {
  return one<{ found: number }>(db, "SELECT 1 AS found FROM generated_paths WHERE user_id = ? AND career_id = ?", [userId, careerId]) !== undefined;
}

/** Authored content plus this learner's generated packs and jobs. Use this for every learner-facing lookup. */
export function contentFor(core: Core, userId: string): ContentIndex {
  let perCore = caches.get(core);
  if (!perCore) {
    perCore = new Map();
    caches.set(core, perCore);
  }
  const cached = perCore.get(userId);
  if (cached) return cached;

  const paths = generatedPathRows(core.db, userId).map((row) => JSON.parse(row.data) as GeneratedPath);
  const index = buildContentIndex({
    careers: [...core.content.careers, ...paths.map((p) => p.pack.career)],
    companies: [...core.content.companies, ...paths.flatMap((p) => p.pack.companies)],
    npcs: [...core.content.npcs, ...paths.flatMap((p) => p.pack.npcs)],
    scenarios: [...core.content.scenarios, ...paths.flatMap((p) => p.pack.scenarios)],
    trainings: core.content.trainings,
    jobs: [...core.content.jobs, ...paths.flatMap((p) => p.jobs)],
  });
  perCore.set(userId, index);
  return index;
}

/** Drops the cached index for one learner. Call after saving or deleting a generated path. */
export function invalidateContent(core: Core, userId: string): void {
  caches.get(core)?.delete(userId);
}
