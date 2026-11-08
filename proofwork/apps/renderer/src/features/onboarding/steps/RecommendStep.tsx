import { useState, type CSSProperties } from "react";
import { motion } from "motion/react";
import { getCareer } from "@pw/content";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/Progress";
import { MonoLabel } from "@/components/ui/Labels";
import type { FtuxView } from "@pw/shared";
import type { StepProps } from "../types";

type Rec = FtuxView["recommendations"][number];

export function RecommendStep({ view, busy, send }: StepProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  const recs = view.recommendations ?? [];

  const choose = (careerId: string) => {
    if (busy) return;
    setChosen(careerId);
    send({ kind: "SELECT_CAREER", careerId });
  };

  return (
    <section aria-labelledby="ftux-match-prompt" className="flex min-h-0 flex-1 flex-col items-center gap-6 overflow-y-auto py-2">
      <div className="text-center">
        <MonoLabel tone="accent">Your matches</MonoLabel>
        <h1 id="ftux-match-prompt" className="mt-2 font-serif text-[30px] leading-tight font-medium text-fg">
          {view.prompt}
        </h1>
      </div>

      <div className="grid w-full max-w-[1000px] gap-4 md:grid-cols-3">
        {recs.map((rec, i) => (
          <RecCard key={rec.careerId} rec={rec} index={i} busy={busy} isChosen={chosen === rec.careerId} onChoose={() => choose(rec.careerId)} />
        ))}
      </div>
    </section>
  );
}

function RecCard({ rec, index, busy, isChosen, onChoose }: { rec: Rec; index: number; busy: boolean; isChosen: boolean; onChoose: () => void }) {
  const career = getCareer(rec.careerId);
  const color = career?.color ?? "var(--color-accent)";
  const ringStyle = { "--color-accent": color } as CSSProperties;
  const match = Math.round(Math.min(100, Math.max(0, rec.match)));
  const title = career?.title ?? rec.title;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, duration: 0.25, ease: "easeOut" }}
      className="glass relative flex flex-col gap-4 overflow-hidden rounded-glass p-6"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: color }} />
      <div className="flex items-center gap-4">
        <div style={ringStyle} className="shrink-0">
          <ProgressRing value={match / 100} size={72} stroke={6} label={`${title} match`}>
            <span className="font-mono text-[15px] font-semibold text-fg">{match}%</span>
          </ProgressRing>
        </div>
        <h2 className="font-serif text-[22px] leading-tight font-medium text-fg">{title}</h2>
      </div>
      <p className="flex-1 text-[14px] leading-relaxed text-fg-muted">{rec.reason}</p>
      <Button
        variant="primary"
        size="md"
        className="w-full"
        disabled={busy && !isChosen}
        loading={busy && isChosen}
        onClick={onChoose}
        aria-label={`Choose this path: ${title}`}
      >
        Choose this path
      </Button>
    </motion.article>
  );
}
