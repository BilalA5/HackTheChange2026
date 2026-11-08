import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import type { Objective, ScenarioDetail } from "@pw/shared";
import { api } from "@/lib/api";
import { cancel } from "@/lib/voice/tts";
import { NpcAvatar, NotesCard, PushToTalkButton, VoiceBubble } from "@/components/domain";
import { Button } from "@/components/ui/Button";
import { MonoLabel } from "@/components/ui/Labels";
import { ErrorNotice } from "../ErrorNotice";
import { failureFrom, type Failure } from "../lib/failures";
import { usePlayedTracker } from "../lib/played";
import { useMeetingPrefs } from "../lib/prefs";
import { useProgress } from "@/stores/progress";
import { KickoffPlayer } from "../kickoff/KickoffPlayer";
import { PassedOverlay } from "./PassedOverlay";

export interface PouViewProps {
  objectiveId: string;
  scenario: ScenarioDetail;
  objective: Objective;
  onObjective(o: Objective): void;
  refresh(): Promise<void>;
}

/** Proof of Understanding: spoken questions on the left, read-only Meeting Notes on the right. */
export function PouView({ objectiveId, scenario, objective, onObjective, refresh }: PouViewProps) {
  const navigate = useNavigate();
  const prefs = useMeetingPrefs();
  const npc = scenario.npc;
  const turns = objective.pou.turns;
  const status = objective.pou.status;
  const questionCount = scenario.pou.length;
  const questionNo = Math.min(objective.pou.questionIndex + 1, Math.max(1, questionCount));

  const tracker = usePlayedTracker(turns.map((t) => t.id));
  const [pending, setPending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [replay, setReplay] = useState(false);
  const startedRef = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  const startPou = useCallback(async () => {
    setStarting(true);
    setFailure(null);
    try {
      const res = await api("POST /objectives/:id/pou/start", { params: { id: objectiveId } });
      onObjective(res.objective);
    } catch (e) {
      setFailure(failureFrom(e));
    } finally {
      setStarting(false);
    }
  }, [objectiveId, onObjective]);

  // Entering the phase starts (or resumes) the questions. Runs once per mount.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void startPou();
  }, [startPou]);

  useEffect(() => {
    if (status === "passed") void useProgress.getState().refresh();
  }, [status]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [turns.length, pending]);

  useEffect(() => {
    cancel();
  }, [replay]);

  const submit = async (transcript: string) => {
    const text = transcript.trim();
    if (!text || pending || replay || status === "passed") return;
    setPending(true);
    setFailure(null);
    try {
      const res = await api("POST /objectives/:id/pou/answer", { params: { id: objectiveId }, body: { transcript: text } });
      onObjective(res.objective);
      await refresh();
    } catch (e) {
      setFailure(failureFrom(e));
    } finally {
      setPending(false);
    }
  };

  const firstStage = [...scenario.stages].sort((a, b) => a.order - b.order)[0];

  const startStage = async () => {
    if (!firstStage || launching) return;
    setLaunching(true);
    setFailure(null);
    try {
      const fresh = await api("POST /objectives/:id/stages/:stageId/start", {
        params: { id: objectiveId, stageId: firstStage.id },
      });
      onObjective(fresh);
      void useProgress.getState().refresh();
      navigate(`/objective/${objectiveId}/stage/${firstStage.id}`);
    } catch (e) {
      setFailure(failureFrom(e));
      setLaunching(false);
    }
  };

  if (replay) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center justify-between gap-3 px-8">
          <MonoLabel className="text-muted">Rewatch the kickoff · read only</MonoLabel>
          <button
            type="button"
            onClick={() => setReplay(false)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-ink hover:bg-ink/5"
          >
            <ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" />
            Back to proof
          </button>
        </div>
        <KickoffPlayer
          scenario={scenario}
          objective={objective}
          prefs={prefs}
          replay
          onObjective={onObjective}
          onExit={() => setReplay(false)}
        />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 gap-5 px-6 pt-3 pb-5">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        <div className="flex shrink-0 items-center justify-center gap-4">
          <span className="rounded-full bg-ink px-4 py-1.5 font-mono text-[11px] tracking-[0.08em] text-white uppercase">
            {status === "passed" ? "Passed" : `Question ${questionNo} of ${questionCount}`}
          </span>
          <button
            type="button"
            onClick={() => setReplay(true)}
            className="font-mono text-[11px] tracking-[0.08em] text-ink/70 uppercase underline-offset-4 hover:text-ink hover:underline"
          >
            Rewatch kickoff
          </button>
        </div>

        {status === "needs_retry" && (
          <div role="status" className="shrink-0 rounded-2xl bg-warning/15 px-4 py-2.5 text-[14px] text-ink">
            Let&apos;s try that one again. Listen to the question and answer in your own words.
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto pr-2">
          {turns.length === 0 && !starting && !failure && (
            <p className="py-10 text-center text-[14px] text-muted">The questions will appear here.</p>
          )}
          <div className="flex flex-col gap-4 py-2">
            {turns.map((turn) =>
              turn.role === "npc" ? (
                <VoiceBubble
                  key={turn.id}
                  side="npc"
                  name={npc.name}
                  avatarSeed={npc.avatarSeed}
                  voice={npc.voice}
                  text={turn.text}
                  autoPlay={tracker.shouldAutoPlay(turn.id)}
                />
              ) : (
                <VoiceBubble key={turn.id} side="learner" name="You" text={turn.text} autoPlay={false} />
              ),
            )}
            {(pending || starting) && <ThinkingBubble name={npc.name} avatarSeed={npc.avatarSeed} />}
          </div>
          <div ref={endRef} />
        </div>

        {failure && (
          <ErrorNotice
            failure={failure}
            onRetry={() => {
              if (turns.length === 0) void startPou();
            }}
          />
        )}

        <div className="flex shrink-0 justify-center pt-1">
          <div className="w-full max-w-[560px]">
            <PushToTalkButton
              onFinal={(text) => void submit(text)}
              enabled={!pending && !starting && status !== "passed"}
            />
          </div>
        </div>
      </div>

      <aside className="flex min-h-0 w-[340px] shrink-0 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <NotesCard notes={objective.notes} readOnly />
        </div>
      </aside>

      {status === "passed" && (
        <PassedOverlay
          xp={objective.xpEarned}
          firstStageTitle={firstStage?.title ?? null}
          launching={launching}
          failure={failure}
          canStart={firstStage !== undefined}
          onStart={() => void startStage()}
        />
      )}
    </div>
  );
}

function ThinkingBubble({ name, avatarSeed }: { name: string; avatarSeed: string }) {
  return (
    <div role="status" aria-label={`${name} is thinking`} className="flex items-end gap-3">
      <NpcAvatar name={name} seed={avatarSeed} size="sm" speaking />
      <div className="flex items-center gap-1.5 rounded-[22px] bg-white px-5 py-4 shadow-[0_10px_24px_-14px_rgb(30_25_10/0.35)]">
        <span className="size-2 animate-bounce rounded-full bg-ink/40 [animation-delay:-0.3s]" />
        <span className="size-2 animate-bounce rounded-full bg-ink/40 [animation-delay:-0.15s]" />
        <span className="size-2 animate-bounce rounded-full bg-ink/40" />
      </div>
    </div>
  );
}
