import { RUBRIC_LEVEL_LABEL, type RubricLevel } from "@pw/shared";
import { Pill, type Tone } from "../ui/Labels";

const TONE: Record<RubricLevel, Tone> = { below: "danger", meeting: "accent", exceeding: "success" };

/** Overall performance chip. null = not graded yet. */
export function PerformanceBadge({ level, className }: { level: RubricLevel | null; className?: string }) {
  if (!level) {
    return (
      <Pill tone="neutral" className={className}>
        Not graded yet
      </Pill>
    );
  }
  return (
    <Pill tone={TONE[level]} className={className}>
      {RUBRIC_LEVEL_LABEL[level]}
    </Pill>
  );
}
