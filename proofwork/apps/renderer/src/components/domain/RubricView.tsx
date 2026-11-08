import {
  RUBRIC_AXES,
  RUBRIC_AXIS_LABEL,
  RUBRIC_LEVEL_LABEL,
  type Rubric,
  type RubricLevel,
} from "@pw/shared";
import { cn } from "@/lib/cn";

export const RUBRIC_LEVEL_TONE: Record<RubricLevel, string> = {
  below: "bg-danger/15 text-danger",
  meeting: "bg-accent/15 text-accent",
  exceeding: "bg-success/15 text-success",
};

const SHORT_LEVEL: Record<RubricLevel, string> = { below: "Below", meeting: "Meeting", exceeding: "Exceeding" };

export interface RubricViewProps {
  rubric: Rubric;
  /** compact: four chips in a row. full: a row per axis with its rationale. */
  variant?: "compact" | "full";
  className?: string;
}

/** The four rubric axes, each with a Below / Meeting / Exceeding chip. */
export function RubricView({ rubric, variant = "full", className }: RubricViewProps) {
  if (variant === "compact") {
    return (
      <ul className={cn("flex flex-wrap gap-2", className)} aria-label="Rubric">
        {RUBRIC_AXES.map((axis) => (
          <li
            key={axis}
            className={cn("rounded-full px-2.5 py-1 text-[12px] font-medium", RUBRIC_LEVEL_TONE[rubric[axis].level])}
          >
            {RUBRIC_AXIS_LABEL[axis]}: {SHORT_LEVEL[rubric[axis].level]}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <dl className={cn("flex flex-col gap-4", className)} aria-label="Rubric">
      {RUBRIC_AXES.map((axis) => {
        const score = rubric[axis];
        return (
          <div key={axis} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[14px] font-medium">{RUBRIC_AXIS_LABEL[axis]}</dt>
              <dd className={cn("rounded-full px-2.5 py-0.5 font-mono text-[11px] tracking-[0.04em] uppercase", RUBRIC_LEVEL_TONE[score.level])}>
                {RUBRIC_LEVEL_LABEL[score.level]}
              </dd>
            </div>
            <p className="text-[13px] leading-relaxed text-fg-muted">{score.rationale}</p>
          </div>
        );
      })}
    </dl>
  );
}
