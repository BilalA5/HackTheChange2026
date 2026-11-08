import { motion } from "motion/react";
import { LockOpen } from "lucide-react";
import { getCareer, getCompany, getScenario } from "@pw/content";
import { Button } from "@/components/ui/Button";
import { MonoLabel } from "@/components/ui/Labels";
import { CompanyGlyph } from "@/components/domain/CompanyGlyph";
import { initialsOf } from "@/components/domain/NpcAvatar";
import type { StepProps } from "../types";

export function RoadmapStep({ view, busy, send }: StepProps) {
  const roadmap = view.roadmap;
  const scenarios = roadmap?.scenarios ?? [];
  const career = roadmap ? getCareer(roadmap.careerId) : undefined;

  return (
    <section aria-labelledby="ftux-roadmap-prompt" className="flex min-h-0 flex-1 flex-col items-center gap-5">
      <div className="text-center">
        <MonoLabel tone="accent">{career ? `${career.title} roadmap` : "Your roadmap"}</MonoLabel>
        <h1 id="ftux-roadmap-prompt" className="mt-2 font-serif text-[30px] leading-tight font-medium text-fg">
          {view.prompt}
        </h1>
      </div>

      <div className="glass flex min-h-0 w-full max-w-[640px] shrink flex-col overflow-hidden rounded-glass">
        <ol aria-label="Roadmap projects" className="relative min-h-0 overflow-y-auto px-6 py-5">
          {scenarios.length > 1 && <span aria-hidden className="absolute top-9 bottom-9 left-[41px] w-px bg-white/15" />}
          {scenarios.map((s, i) => {
            const scenario = getScenario(s.scenarioId);
            const company = scenario ? getCompany(scenario.companyId) : undefined;
            const glyph = company ?? { name: s.company, glyph: initialsOf(s.company), color: "var(--color-accent)" };
            return (
              <motion.li
                key={s.scenarioId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.25, ease: "easeOut" }}
                className="relative flex items-center gap-4 py-2.5"
              >
                <span className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-night-2 font-mono text-[13px] text-fg">
                  {i + 1}
                </span>
                <CompanyGlyph company={glyph} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-medium text-fg">{s.title}</div>
                  <div className="truncate text-[13px] text-fg-muted">{s.company}</div>
                </div>
                <MonoLabel className="shrink-0">~{s.estMinutes} min</MonoLabel>
              </motion.li>
            );
          })}
          {scenarios.length === 0 && <li className="py-6 text-center text-[14px] text-fg-muted">Your projects will appear here.</li>}
          <li className="mt-2 flex items-center justify-center gap-2 pt-3 pb-1 text-[14px] text-fg-muted">
            <LockOpen size={16} strokeWidth={1.75} aria-hidden="true" className="text-success" />
            <span>…then your job portal unlocks</span>
          </li>
        </ol>
      </div>

      <Button variant="light" size="lg" disabled={busy} loading={busy} onClick={() => send({ kind: "CONTINUE" })} >
        Continue
      </Button>
    </section>
  );
}
