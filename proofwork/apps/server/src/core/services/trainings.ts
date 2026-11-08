// Trainings: the catalog, the learner's library, recommendations and lesson progress.
import type { TrainingProgress } from "@pw/shared";
import { all, one, run, type Db } from "../db.ts";
import { badRequest, insufficientCredits, notFound } from "../errors.ts";
import type { Core } from "../types.ts";
import { nowIso } from "../util.ts";
import { asObject, reqBool, reqNum, reqStr } from "../validate.ts";
import { debit } from "./credits.ts";
import { contentFor, generatedPathFor } from "../user-content.ts";
import { requireUser } from "./users.ts";

interface ProgressRow {
  training_id: string;
  lesson_index: number;
  completed: number;
  updated_at: string;
}

const toProgress = (r: ProgressRow): TrainingProgress => ({
  trainingId: r.training_id,
  lessonIndex: r.lesson_index,
  completed: r.completed === 1,
  updatedAt: r.updated_at,
});

export function libraryIds(db: Db, userId: string): string[] {
  return all<{ training_id: string }>(db, "SELECT training_id FROM training_library WHERE user_id = ? ORDER BY added_at, rowid", [userId]).map(
    (r) => r.training_id,
  );
}

function progressMap(db: Db, userId: string): Record<string, TrainingProgress> {
  const rows = all<ProgressRow>(db, "SELECT training_id, lesson_index, completed, updated_at FROM training_progress WHERE user_id = ?", [userId]);
  return Object.fromEntries(rows.map((r) => [r.training_id, toProgress(r)]));
}

/** Training ids recommended for a career: a generated path's own picks, or the authored recommendedFor list. */
export function trainingIdsForCareer(core: Core, userId: string, careerId: string): string[] {
  const generated = generatedPathFor(core.db, userId, careerId);
  if (generated) return generated.recommendedTrainingIds;
  return contentFor(core, userId).trainingsForCareer(careerId).map((t) => t.id);
}

/** Adds training ids to the library (existing entries are kept). */
export function addTrainingIds(core: Core, userId: string, trainingIds: string[]): void {
  for (const trainingId of trainingIds) {
    run(core.db, "INSERT OR IGNORE INTO training_library (user_id, training_id, added_at) VALUES (?, ?, ?)", [userId, trainingId, nowIso()]);
  }
}

/** Adds the career's recommended trainings to the library (existing entries are kept). */
export function addRecommendedTrainings(core: Core, userId: string, careerId: string): void {
  addTrainingIds(core, userId, trainingIdsForCareer(core, userId, careerId));
}

export function trainingState(core: Core, userId: string): { library: string[]; progress: Record<string, TrainingProgress>; recommended: string[] } {
  const user = requireUser(core.db, userId);
  const recommended = user.careerId ? trainingIdsForCareer(core, userId, user.careerId) : [];
  return { library: libraryIds(core.db, userId), progress: progressMap(core.db, userId), recommended };
}

export function addToLibrary(core: Core, userId: string, trainingId: string): { library: string[] } {
  if (!contentFor(core, userId).getTraining(trainingId)) throw notFound("Training not found.");
  run(core.db, "INSERT OR IGNORE INTO training_library (user_id, training_id, added_at) VALUES (?, ?, ?)", [userId, trainingId, nowIso()]);
  return { library: libraryIds(core.db, userId) };
}

export function removeFromLibrary(core: Core, userId: string, trainingId: string): { library: string[] } {
  run(core.db, "DELETE FROM training_library WHERE user_id = ? AND training_id = ?", [userId, trainingId]);
  return { library: libraryIds(core.db, userId) };
}

/** Debits training_lesson when the lesson index moves forward. */
export function recordLesson(core: Core, userId: string, trainingId: string, body: unknown): TrainingProgress {
  const o = asObject(body);
  const lessonIndex = reqNum(o, "lessonIndex", { min: 0, max: 100, integer: true });
  const completed = reqBool(o, "completed");
  const training = contentFor(core, userId).getTraining(trainingId);
  if (!training) throw notFound("Training not found.");
  if (lessonIndex >= training.lessons.length) throw badRequest("lessonIndex is past the last lesson.");

  const previous = one<{ lesson_index: number }>(core.db, "SELECT lesson_index FROM training_progress WHERE user_id = ? AND training_id = ?", [
    userId,
    trainingId,
  ]);
  if (lessonIndex > (previous?.lesson_index ?? -1)) {
    if (!debit(core, userId, "training_lesson").ok) throw insufficientCredits();
  }
  const updatedAt = nowIso();
  run(
    core.db,
    `INSERT INTO training_progress (user_id, training_id, lesson_index, completed, updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (user_id, training_id) DO UPDATE SET lesson_index = excluded.lesson_index, completed = excluded.completed, updated_at = excluded.updated_at`,
    [userId, trainingId, lessonIndex, completed ? 1 : 0, updatedAt],
  );
  return { trainingId, lessonIndex, completed, updatedAt };
}

export function requireTrainingId(body: unknown): string {
  return reqStr(asObject(body), "trainingId", { max: 128 });
}
