import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { CUSTOM_CAREER_ID, type FtuxView } from "@pw/shared";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/Progress";
import { MonoLabel, Badge } from "@/components/ui/Labels";
import type { StepProps } from "../types";

type Rec = FtuxView["recommendations"][number];

const FALLBACK_COLOR = "var(--color-accent)";

/** Accent colour for a recommendation. Ready-made paths carry their own colour from the server. */
export function recColor(rec: Rec): string {
  const c = rec.color?.trim();
  return c && c.length > 0 ? c : FALLBACK_COLOR;
}

export function matchPercent(match: number): number {
  return Math.round(Math.min(100, Math.max(0, Number.isFinite(match) ? match : 0)));
}

/** Splits the server list into the custom path (featured) and the ready-made alternatives. */
export function splitRecommendations(recs: readonly Rec[]): { custom: Rec | null; ready: Rec[] } {
  const custom = recs.find((r) => r.kind === "custom") ?? null;
  const ready = recs.filter((r) => r !== custom);
  return { custom, ready };
}

export function RecommendStep({ view, busy, send }: StepProps) {
  const recs = view.recommendations ?? [];
  const { custom, ready } = splitRecommendations(recs);

  const buildCustom = () => {
    if (busy) return;
    send({ kind: "SELECT_CAREER", careerId: CUSTOM_CAREER_ID });
  };

  const choose = (careerId: string) => {
    if (busy) return;
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

      {recs.length === 0 && <p className="text-[14px] text-fg-muted">No matches yet. Go back and answer the guide again.</p>}

      <div className="grid w-full max-w-[1000px] gap-4 md:grid-cols-3">
        {custom && (
          <div className={ready.length > 0 ? "md:col-span-2" : "mx-auto w-full max-w-[640px] md:col-span-3"}>
            <CustomCard rec={custom} busy={busy} onBuild={buildCustom} />
          </div>
        )}
        {ready.length > 0 && (
          <div className={custom ? "flex flex-col gap-4 md:col-span-1" : "contents"}>
            {ready.map((rec, i) => (
              <ReadyCard key={rec.careerId} rec={rec} index={i} busy={busy} onChoose={() => choose(rec.careerId)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CustomCard({ rec, busy, onBuild }: { rec: Rec; busy: boolean; onBuild: () => void }) {
  const color = recColor(rec);
  const match = matchPercent(rec.match);
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      aria-label={`Built for you: ${rec.title}`}
      className="glass relative flex h-full flex-col gap-5 overflow-hidden rounded-glass p-8 shadow-[0_0_80px_-28px_var(--color-accent)]"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: color }} />
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="accent">Built for you</Badge>
        <span className="font-mono text-[11px] tracking-[0.08em] text-fg-muted uppercase">3 projects · 3 companies</span>
      </div>
      <div className="flex items-center gap-5">
        <div className="shrink-0" style={{ "--color-accent": color } as CSSProperties}>
          <ProgressRing value={match / 100} size={88} stroke={7} label={`${rec.title} match`}>
            <span className="font-mono text-[17px] font-semibold text-fg">{match}%</span>
          </ProgressRing>
        </div>
        <h2 className="font-serif text-[30px] leading-tight font-medium text-fg">{rec.title}</h2>
      </div>
      <p className="text-[15px] leading-relaxed text-fg-muted">{rec.reason}</p>
      <div className="mt-auto">
        <Button
          variant="light"
          size="lg"
          className="w-full"
          disabled={busy}
          loading={busy}
          onClick={onBuild}
          aria-label={`Build my path: ${rec.title}`}
        >
          Build my path
        </Button>
        <p className="mt-3 text-center text-[12px] text-fg-muted">Takes about a minute. Every company, manager and brief is written for you.</p>
      </div>
    </motion.article>
  );
}

function ReadyCard({ rec, index, busy, onChoose }: { rec: Rec; index: number; busy: boolean; onChoose: () => void }) {
  const color = recColor(rec);
  const match = matchPercent(rec.match);
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * (index + 1), duration: 0.25, ease: "easeOut" }}
      className="glass relative flex flex-col gap-4 overflow-hidden rounded-glass p-6"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: color }} />
      <MonoLabel>Ready-made path</MonoLabel>
      <div className="flex items-center gap-4">
        <div className="shrink-0" style={{ "--color-accent": color } as CSSProperties}>
          <ProgressRing value={match / 100} size={60} stroke={5} label={`${rec.title} match`}>
            <span className="font-mono text-[12px] font-semibold text-fg">{match}%</span>
          </ProgressRing>
        </div>
        <h2 className="font-serif text-[20px] leading-tight font-medium text-fg">{rec.title}</h2>
      </div>
      <p className="flex-1 text-[13px] leading-relaxed text-fg-muted">{rec.reason}</p>
      <Button variant="glass" size="md" className="w-full" disabled={busy} onClick={onChoose} aria-label={`Choose this path: ${rec.title}`}>
        Choose this path
      </Button>
    </motion.article>
  );
}
