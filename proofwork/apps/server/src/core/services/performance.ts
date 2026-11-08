// Rubric roll-ups: per-axis merge across stage evaluations and the overall level shown on cards.
import { RUBRIC_AXES, type Evaluation, type Objective, type Rubric, type RubricLevel } from "@pw/shared";

export function allEvaluations(obj: Objective): Evaluation[] {
  return Object.values(obj.stages)
    .flatMap((stage) => (stage.evaluation ? [stage.evaluation] : []))
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
}

export function latestEvaluation(obj: Objective): Evaluation | null {
  const evaluations = allEvaluations(obj);
  return evaluations[evaluations.length - 1] ?? null;
}

/** Per axis, the level from the most recent evaluation that scored it. */
export function computePerformance(obj: Objective): Rubric | null {
  const evaluations = allEvaluations(obj);
  if (evaluations.length === 0) return null;
  const merged = {} as Rubric;
  for (const evaluation of evaluations) {
    for (const axis of RUBRIC_AXES) merged[axis] = evaluation.rubric[axis];
  }
  return merged;
}

/** Majority level across the four axes; ties resolve to "meeting". */
export function overallLevel(rubric: Rubric | null): RubricLevel | null {
  if (!rubric) return null;
  const counts = new Map<RubricLevel, number>();
  for (const axis of RUBRIC_AXES) {
    const level = rubric[axis].level;
    counts.set(level, (counts.get(level) ?? 0) + 1);
  }
  const top = Math.max(...counts.values());
  const leaders = [...counts.entries()].filter(([, n]) => n === top).map(([level]) => level);
  return leaders.length === 1 ? (leaders[0] ?? "meeting") : "meeting";
}
