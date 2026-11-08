import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { MonoLabel } from "@/components/ui/Labels";
import { NpcAvatar } from "@/components/domain";
import { estimateDurationSec } from "@/lib/voice/tts";
import type { Objective, ScenarioDetail } from "@pw/shared";
import { cn } from "@/lib/cn";
import { estimateKickoffMinutes, resumeSegmentIndex } from "../lib/timing";
import { useMeetingPrefs, type MeetingPrefs } from "../lib/prefs";
import { MeetingToggles } from "./MeetingToggles";
import { KickoffPlayer } from "./KickoffPlayer";

export interface KickoffPhaseProps {
  scenario: ScenarioDetail;
  objective: Objective;
  onObjective(o: Objective): void;
}

/** Kickoff phase: the lobby card, then the narrated player with checkpoints. */
export function KickoffPhase({ scenario, objective, onObjective }: KickoffPhaseProps) {
  const [joined, setJoined] = useState(false);
  const prefs = useMeetingPrefs();

  if (!joined) {
    return <KickoffLobby scenario={scenario} objective={objective} prefs={prefs} onJoin={() => setJoined(true)} />;
  }
  return <KickoffPlayer scenario={scenario} objective={objective} prefs={prefs} onObjective={onObjective} />;
}

interface KickoffLobbyProps {
  scenario: ScenarioDetail;
  objective: Objective;
  prefs: MeetingPrefs;
  onJoin(): void;
}

function KickoffLobby({ scenario, objective, prefs, onJoin }: KickoffLobbyProps) {
  const segments = scenario.kickoff.segments;
  const minutes = estimateKickoffMinutes(segments.map((s) => estimateDurationSec(s.transcript)));
  const resumeAt = resumeSegmentIndex(
    segments.map((s) => s.id),
    (id) => objective.noteVerdicts[id]?.accepted === true,
  );
  const npc = scenario.npc;

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-8">
      <section className="paper flex w-full max-w-[640px] flex-col items-center gap-5 p-10 text-center">
        <NpcAvatar name={npc.name} seed={npc.avatarSeed} size="lg" />
        <MonoLabel tone="accent">Kickoff meeting</MonoLabel>
        <h1 className="font-serif text-[30px] leading-tight font-medium text-ink">Kickoff with {npc.name}</h1>
        <p className="text-[14px] text-muted">
          {segments.length} parts · ~{minutes} min
        </p>

        {segments.length > 0 && (
          <ol className="flex w-full flex-col gap-2 text-left">
            {segments.map((s, i) => {
              const done = objective.noteVerdicts[s.id]?.accepted === true;
              return (
                <li key={s.id} className="flex items-center gap-3 rounded-2xl bg-paper/70 px-4 py-2.5">
                  <span className="font-mono text-[12px] text-muted">{i + 1}</span>
                  <span className="flex-1 text-[14px] text-ink">{s.title}</span>
                  {done && <MonoLabel tone="success">Note accepted</MonoLabel>}
                </li>
              );
            })}
          </ol>
        )}

        {resumeAt > 0 && resumeAt < segments.length && (
          <p className="text-[13px] text-muted">Picking up at part {resumeAt + 1}.</p>
        )}

        <Button size="lg" onClick={onJoin} className={cn("min-w-[200px]")}>
          Join now
        </Button>

        <MeetingToggles
          speed={prefs.speed}
          captions={prefs.captions}
          onSpeedChange={prefs.setSpeed}
          onCaptionsChange={prefs.setCaptions}
        />
      </section>
    </div>
  );
}
