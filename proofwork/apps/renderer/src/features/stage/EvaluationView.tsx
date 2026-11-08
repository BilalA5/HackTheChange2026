import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, RotateCcw, Trophy } from "lucide-react";
import type { Evaluation } from "@pw/shared";
import { Button } from "@/components/ui/Button";
import { RubricView } from "@/components/domain/RubricView";
import { PerformanceBadge } from "@/components/domain/PerformanceBadge";
import { XpChip } from "@/components/domain/XpChip";
import type { NextStageRoute } from "./helpers";

export interface EvaluationViewProps {
  evaluation: Evaluation;
  /** The stage after this one, when there is one. Only used when the stage is passed. */
  nextRoute: NextStageRoute | null;
  nextBusy?: boolean;
  onNext(route: NextStageRoute): void;
  onRevise(): void;
  onReview(): void;
}

/** Feedback for one submission: level, rubric, summary, strengths, improvements, XP and the next action. */
export function EvaluationView({ evaluation, nextRoute, nextBusy = false, onNext, onRevise, onReview }: EvaluationViewProps) {
  const reduce = useReducedMotion();
  const passed = evaluation.passed;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <PerformanceBadge level={evaluation.overall} />
        {passed ? (
          <motion.span
            initial={reduce ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className="inline-flex"
            aria-label={`Earned ${evaluation.xp} XP`}
          >
            <XpChip amount={evaluation.xp} />
          </motion.span>
        ) : (
          <span className="font-mono text-[12px] text-fg-muted">+{evaluation.xp} XP so far</span>
        )}
        {passed && (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-success">
            <Trophy size={14} strokeWidth={1.75} aria-hidden="true" />
            Stage passed
          </span>
        )}
      </div>

      <p className="text-[15px] leading-relaxed text-fg">{evaluation.summary}</p>

      <RubricView rubric={evaluation.rubric} variant="full" />

      <div className="grid gap-5 sm:grid-cols-2">
        <section aria-label="Strengths" className="flex flex-col gap-2">
          <h3 className="font-mono text-[11px] font-medium tracking-[0.08em] text-success uppercase">Strengths</h3>
          {evaluation.strengths.length > 0 ? (
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[14px] text-fg/90">
              {evaluation.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-fg-muted italic">Nothing listed.</p>
          )}
        </section>
        <section aria-label="Improvements" className="flex flex-col gap-2">
          <h3 className="font-mono text-[11px] font-medium tracking-[0.08em] text-warning uppercase">To improve</h3>
          {evaluation.improvements.length > 0 ? (
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[14px] text-fg/90">
              {evaluation.improvements.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-fg-muted italic">Nothing listed.</p>
          )}
        </section>
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-5">
        {passed ? (
          nextRoute ? (
            <Button variant="primary" size="md" loading={nextBusy} iconRight={<ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />} onClick={() => onNext(nextRoute)}>
              Next stage
            </Button>
          ) : (
            <Button variant="primary" size="md" iconRight={<ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />} onClick={onReview}>
              See project review
            </Button>
          )
        ) : (
          <Button variant="primary" size="md" icon={<RotateCcw size={15} strokeWidth={1.75} aria-hidden="true" />} onClick={onRevise}>
            Revise and resubmit
          </Button>
        )}
      </div>
    </div>
  );
}
