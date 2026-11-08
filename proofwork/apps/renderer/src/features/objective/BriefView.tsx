import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { Objective, ScenarioDetail } from "@pw/shared";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/Surfaces";
import { MonoLabel, Pill } from "@/components/ui/Labels";
import { CompanyGlyph, NpcAvatar } from "@/components/domain";
import { ErrorNotice } from "./ErrorNotice";
import { failureFrom, type Failure } from "./lib/failures";

/** "45 min" below an hour, otherwise "1.5 hr". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours} hr`;
}

export interface BriefViewProps {
  scenario: ScenarioDetail;
  objective: Objective;
  onObjective(o: Objective): void;
  refresh(): Promise<void>;
}

/** Dark editorial brief: hero, role, tools, workflows, skills, stages and deliverables. */
export function BriefView({ scenario, objective, onObjective, refresh }: BriefViewProps) {
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const company = scenario.company;
  const npc = scenario.npc;
  const stages = [...scenario.stages].sort((a, b) => a.order - b.order);
  const stageMinutes = stages.reduce((n, s) => n + s.estMinutes, 0);

  const join = async () => {
    setBusy(true);
    setFailure(null);
    try {
      onObjective(await api("PATCH /objectives/:id", { params: { id: objective.id }, body: { phase: "kickoff" } }));
      await refresh();
    } catch (e) {
      setFailure(failureFrom(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <section
          className="relative overflow-hidden px-10 pt-8 pb-10"
          style={{ background: `linear-gradient(135deg, ${company.color} 0%, var(--color-night) 82%)` }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-4 -bottom-7 font-serif text-[168px] leading-none font-semibold whitespace-nowrap text-white/10 select-none"
          >
            {scenario.coverWord}
          </span>
          <div className="relative flex max-w-[860px] flex-col gap-5">
            <div className="flex items-center gap-3">
              <CompanyGlyph company={company} size="md" />
              <MonoLabel className="text-white/75">
                {company.name} · {company.industry}
              </MonoLabel>
            </div>
            <MonoLabel className="text-white/60">Project brief · {scenario.projectType}</MonoLabel>
            <h1 className="font-serif text-[40px] leading-[1.1] font-medium text-white">{scenario.title}</h1>
            <div className="flex w-fit items-center gap-3 rounded-2xl bg-black/25 px-4 py-3">
              <NpcAvatar name={npc.name} seed={npc.avatarSeed} size="sm" />
              <div className="flex flex-col">
                <span className="text-[14px] font-medium text-white">{npc.name}</span>
                <span className="text-[12px] text-white/65">{npc.role}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill className="bg-white/10 text-white capitalize">{scenario.difficulty}</Pill>
              <Pill className="bg-white/10 text-white">~{formatDuration(scenario.estMinutes)}</Pill>
              <Pill tone="xp">Up to {scenario.maxXp} XP</Pill>
            </div>
            <p className="max-w-[720px] font-serif text-[21px] leading-relaxed text-white/90">{scenario.problemStatement}</p>
          </div>
        </section>

        <div className="grid gap-5 px-10 py-8 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <GlassCard className="flex flex-col gap-3">
              <MonoLabel>Your role</MonoLabel>
              <p className="text-[15px] leading-relaxed text-fg/90">{scenario.userRole}</p>
            </GlassCard>
            <GlassCard className="flex flex-col gap-3">
              <MonoLabel>Tool stack</MonoLabel>
              <ChipList items={scenario.tools} empty="No tools listed." />
            </GlassCard>
            <GlassCard className="flex flex-col gap-3">
              <MonoLabel>Workflows</MonoLabel>
              {scenario.workflows.length === 0 ? (
                <p className="text-[14px] text-fg-muted">No workflows listed.</p>
              ) : (
                <ul className="flex list-disc flex-col gap-2 pl-5 text-[14px] text-fg/90">
                  {scenario.workflows.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              )}
            </GlassCard>
            <GlassCard className="flex flex-col gap-3">
              <MonoLabel>Skills</MonoLabel>
              <ChipList items={scenario.skills} empty="No skills listed." />
            </GlassCard>
          </div>

          <div className="flex flex-col gap-5">
            <GlassCard className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <MonoLabel>Stages</MonoLabel>
                <MonoLabel className="text-fg-muted">Total ~{formatDuration(stageMinutes)}</MonoLabel>
              </div>
              {stages.length === 0 ? (
                <p className="text-[14px] text-fg-muted">Stages are not set up yet.</p>
              ) : (
                <ol className="flex flex-col gap-3">
                  {stages.map((s, i) => (
                    <li key={s.id} className="flex items-start gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-[12px] text-fg">
                        {i + 1}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-[15px] font-medium text-fg">{s.title}</span>
                        <span className="text-[13px] text-fg-muted">{s.summary}</span>
                      </div>
                      <MonoLabel className="shrink-0 text-fg-muted">est. {s.estMinutes} min</MonoLabel>
                    </li>
                  ))}
                </ol>
              )}
            </GlassCard>
            <GlassCard className="flex flex-col gap-3">
              <MonoLabel>Deliverables</MonoLabel>
              {scenario.deliverables.length === 0 ? (
                <p className="text-[14px] text-fg-muted">No deliverables listed.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {scenario.deliverables.map((d) => (
                    <li key={d.title} className="flex flex-col gap-1">
                      <span className="text-[15px] font-medium text-fg">{d.title}</span>
                      <span className="text-[13px] text-fg-muted">{d.description}</span>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          </div>
        </div>
      </div>

      <footer className="flex shrink-0 flex-col gap-3 border-t border-line px-10 py-4">
        {failure && <ErrorNotice failure={failure} onRetry={join} />}
        <div className="flex items-center justify-between gap-4">
          <span className="text-[14px] text-fg-muted">
            Next: kickoff meeting with {npc.name}, {npc.role}.
          </span>
          <Button variant="light" size="lg" loading={busy} onClick={join} iconRight={<ArrowRight size={18} strokeWidth={1.75} />}>
            Join the kickoff
          </Button>
        </div>
      </footer>
    </div>
  );
}

function ChipList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="text-[14px] text-fg-muted">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Pill key={item} className="bg-white/8 text-fg">
          {item}
        </Pill>
      ))}
    </div>
  );
}
