import { ArrowLeft, Check } from "lucide-react";
import type { ObjectivePhase, ScenarioDetail } from "@pw/shared";
import { cn } from "@/lib/cn";
import { CompanyGlyph, LevelPill } from "@/components/domain";
import { IconButton } from "@/components/ui/Button";
import { MonoLabel } from "@/components/ui/Labels";

const STEPS: { id: ObjectivePhase; label: string }[] = [
  { id: "brief", label: "Brief" },
  { id: "kickoff", label: "Kickoff" },
  { id: "pou", label: "Proof of understanding" },
  { id: "stages", label: "Stages" },
];

function stepIndex(phase: ObjectivePhase): number {
  const i = STEPS.findIndex((s) => s.id === phase);
  return i === -1 ? STEPS.length - 1 : i;
}

export interface TopBarProps {
  scenario: ScenarioDetail;
  phase: ObjectivePhase;
  level: number;
  onBack(): void;
}

/** Back button, scenario title, phase stepper and level pill. */
export function TopBar({ scenario, phase, level, onBack }: TopBarProps) {
  const active = stepIndex(phase);
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line px-5">
      <IconButton label="Back to map" icon={<ArrowLeft size={18} strokeWidth={1.75} />} onClick={onBack} />
      <div className="flex min-w-0 max-w-[300px] items-center gap-3">
        <CompanyGlyph company={scenario.company} size="sm" />
        <span className="truncate text-[14px] font-medium text-fg">{scenario.title}</span>
      </div>
      <nav aria-label="Project phases" className="mx-auto flex min-w-0 items-center gap-2">
        <ol className="flex items-center gap-2">
          {STEPS.map((step, i) => {
            const done = i < active;
            const current = i === active;
            return (
              <li key={step.id} aria-current={current ? "step" : undefined} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden="true" className="text-fg-muted/60">·</span>}
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] tracking-[0.08em] uppercase",
                    current ? "bg-accent/20 text-fg" : done ? "text-fg-muted" : "text-fg-muted/60",
                  )}
                >
                  {done && <Check size={12} strokeWidth={2} aria-hidden="true" className="text-success" />}
                  <span className="whitespace-nowrap">{step.label}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="flex shrink-0 items-center gap-3">
        <MonoLabel className="hidden text-fg-muted 2xl:inline">Level</MonoLabel>
        <LevelPill level={level} />
      </div>
    </header>
  );
}
