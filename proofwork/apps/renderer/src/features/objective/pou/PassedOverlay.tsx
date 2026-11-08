import { motion, useReducedMotion } from "motion/react";
import { XpChip } from "@/components/domain";
import { Button } from "@/components/ui/Button";
import { MonoLabel } from "@/components/ui/Labels";
import { ErrorNotice } from "../ErrorNotice";
import type { Failure } from "../lib/failures";

const COLORS = ["bg-xp", "bg-accent", "bg-success", "bg-warning", "bg-ink"];

/** Fixed pseudo-random layout, so the confetti is stable across renders. */
const PARTICLES = Array.from({ length: 34 }, (_, i) => ({
  id: i,
  left: (i * 29) % 100,
  delay: (i % 9) * 0.07,
  duration: 1.9 + (i % 5) * 0.3,
  spin: ((i * 53) % 360) - 180,
  size: 6 + (i % 4) * 2,
  color: COLORS[i % COLORS.length] ?? "bg-accent",
}));

export interface PassedOverlayProps {
  xp: number;
  firstStageTitle: string | null;
  launching: boolean;
  failure: Failure | null;
  canStart: boolean;
  onStart(): void;
}

/** Celebration after a passed Proof of Understanding: XP unlocked and the first stage to start. */
export function PassedOverlay({ xp, firstStageTitle, launching, failure, canStart, onStart }: PassedOverlayProps) {
  const reduced = useReducedMotion();
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden bg-paper/75 backdrop-blur-[2px]">
      {!reduced &&
        PARTICLES.map((p) => (
          <motion.span
            key={p.id}
            aria-hidden="true"
            className={`pointer-events-none absolute top-0 block rounded-[2px] ${p.color}`}
            style={{ left: `${p.left}%`, width: p.size, height: p.size * 0.5 }}
            initial={{ y: -40, rotate: 0, opacity: 1 }}
            animate={{ y: "110vh", rotate: p.spin, opacity: [1, 1, 0] }}
            transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          />
        ))}

      <section
        role="dialog"
        aria-modal="false"
        aria-label="Proof of understanding passed"
        className="paper relative flex w-[440px] max-w-[92%] flex-col items-center gap-4 p-8 text-center"
      >
        <MonoLabel tone="success">Proof of understanding passed</MonoLabel>
        <h2 className="font-serif text-[30px] leading-tight font-medium text-ink">XP unlocked</h2>
        <XpChip amount={xp} />
        <p className="text-[14px] leading-relaxed text-muted">You showed you understood the brief. Your stages are open.</p>

        {firstStageTitle && (
          <div className="flex w-full flex-col items-center gap-1 rounded-2xl bg-paper/70 px-4 py-3">
            <MonoLabel className="text-muted">Up next · Stage 1</MonoLabel>
            <span className="font-serif text-[17px] text-ink">{firstStageTitle}</span>
          </div>
        )}

        {failure && <ErrorNotice failure={failure} className="w-full text-left" />}

        <Button size="lg" variant="primary" loading={launching} disabled={!canStart} onClick={onStart}>
          Start stage 1
        </Button>
      </section>
    </div>
  );
}
