import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MonoLabel } from "@/components/ui/Labels";
import type { StepProps } from "../types";

export function ClaimStep({ view, busy, send }: StepProps) {
  const credits = Math.max(0, Math.round(view.claim?.credits ?? 0));
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? credits : 0);

  useEffect(() => {
    if (reduce) {
      setShown(credits);
      return;
    }
    const controls = animate(0, credits, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [credits, reduce]);

  return (
    <section aria-labelledby="ftux-claim-prompt" className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto py-4">
      <h1 id="ftux-claim-prompt" className="sr-only">
        {view.prompt}
      </h1>
      <div
        className="relative flex w-full max-w-[520px] flex-col items-center gap-4 overflow-hidden rounded-glass border border-accent/40 px-8 py-10 text-center text-white shadow-[0_0_90px_-16px_var(--color-accent)]"
        style={{ background: "linear-gradient(160deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 35%, var(--color-night)))" }}
      >
        <Sparkles size={26} strokeWidth={1.75} aria-hidden="true" className="text-xp" />
        <MonoLabel className="text-white/75">Welcome credits</MonoLabel>
        <p aria-live="polite" className="font-serif text-[84px] leading-none font-medium tabular-nums">
          {shown.toLocaleString()}
        </p>
        <p className="font-mono text-[12px] tracking-[0.08em] text-white/75 uppercase">credits</p>
        <p className="max-w-[380px] text-[15px] leading-relaxed text-white/85">
          Credits pay for AI feedback on your work and for co-working sessions with your manager. Spend them when you want a second pair of eyes.
        </p>
      </div>

      <Button variant="light" size="lg" disabled={busy} loading={busy} onClick={() => send({ kind: "CLAIM" })}>
        Claim my credits
      </Button>
    </section>
  );
}
