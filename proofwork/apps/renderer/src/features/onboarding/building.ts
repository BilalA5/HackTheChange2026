// Pure helpers for the "Building your path" state. No React, safe to unit test.

/** How long each checklist item stays "active" before the next one takes over. */
export const BUILD_STEP_MS = 12_000;

/** Labels for the animated checklist. The first label names the learner's industry. */
export function buildingSteps(industry: string): string[] {
  const field = industry.trim() || "your field";
  return [
    `Designing three companies around ${field}`,
    "Meeting your managers",
    "Writing kickoff briefs",
    "Planning stages and lessons",
    "Finding jobs that fit",
  ];
}

/**
 * Index of the checklist item that is active after `elapsedMs`. It advances every `stepMs` and
 * stays on the last item, because the server call can take longer than the checklist.
 */
export function activeBuildingStep(elapsedMs: number, count: number, stepMs: number = BUILD_STEP_MS): number {
  if (count <= 0) return -1;
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0 || stepMs <= 0) return 0;
  return Math.min(count - 1, Math.floor(elapsedMs / stepMs));
}

/** Role title shown under the spinner. Falls back to a neutral phrase when the learner has not set one. */
export function buildingRoleTitle(targetRole: string | null | undefined): string {
  const t = (targetRole ?? "").trim();
  return t.length > 0 ? t : "your career";
}
