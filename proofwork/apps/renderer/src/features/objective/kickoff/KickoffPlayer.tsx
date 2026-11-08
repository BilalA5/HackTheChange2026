import { useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import type { KickoffSegment, Objective, ScenarioDetail } from "@pw/shared";
import { api } from "@/lib/api";
import { cancel, estimateDurationSec, speak } from "@/lib/voice/tts";
import { Button, IconButton } from "@/components/ui/Button";
import { MonoLabel } from "@/components/ui/Labels";
import { formatClock } from "@/components/ui/Timer";
import { NOTE_SECTIONS } from "@/components/domain";
import { ErrorNotice } from "../ErrorNotice";
import { failureFrom, type Failure } from "../lib/failures";
import {
  activeSpanIndex,
  boundaryFractions,
  clamp01,
  resumeSegmentIndex,
  sentenceSpans,
  slideSpans,
  splitSentences,
} from "../lib/timing";
import type { MeetingPrefs, Speed } from "../lib/prefs";
import { SlideView } from "./SlideView";
import { CaptionBar } from "./CaptionBar";
import { SegmentTimeline, type TimelineItem } from "./SegmentTimeline";
import { CheckpointPanel } from "./CheckpointPanel";
import { MeetingToggles } from "./MeetingToggles";
import { KickoffCompletion } from "./KickoffCompletion";

const TICK_MS = 100;
/** If speech has not reported its end this long after the timed duration, move on anyway. */
const NARRATION_GRACE_SEC = 12;

type Stage = "watching" | "checkpoint" | "complete" | "finished";

interface PlayerState {
  index: number;
  elapsedMs: number;
  playing: boolean;
  stage: Stage;
  /** Bumped when narration must restart from the beginning of a segment. */
  epoch: number;
}

type Action =
  | { type: "tick"; ms: number }
  | { type: "play"; on: boolean }
  | { type: "restart" }
  | { type: "checkpoint" }
  | { type: "advance"; count: number; end: "complete" | "finished" };

function reducer(s: PlayerState, a: Action): PlayerState {
  switch (a.type) {
    case "tick":
      return s.stage === "watching" ? { ...s, elapsedMs: s.elapsedMs + a.ms } : s;
    case "play":
      return { ...s, playing: a.on };
    case "restart":
      return { ...s, elapsedMs: 0, playing: true, stage: "watching", epoch: s.epoch + 1 };
    case "checkpoint":
      return { ...s, playing: false, stage: "checkpoint" };
    case "advance": {
      const next = s.index + 1;
      if (next < a.count) {
        return { ...s, index: next, elapsedMs: 0, playing: true, stage: "watching", epoch: s.epoch + 1 };
      }
      return { ...s, index: a.count, elapsedMs: 0, playing: false, stage: a.end };
    }
  }
}

function startState(replay: boolean, resumeAt: number, count: number, alreadyWatched = false): PlayerState {
  const base = { elapsedMs: 0, epoch: 0 };
  if (replay) return { ...base, index: 0, playing: true, stage: "watching" };
  if (resumeAt >= count) return { ...base, index: count, playing: false, stage: "complete" };
  // A part that was already watched but whose note is not accepted yet resumes at its checkpoint.
  if (alreadyWatched) return { ...base, index: resumeAt, playing: false, stage: "checkpoint" };
  return { ...base, index: resumeAt, playing: true, stage: "watching" };
}

export interface KickoffPlayerProps {
  scenario: ScenarioDetail;
  objective: Objective;
  prefs: MeetingPrefs;
  /** Read-only replay from the Proof of Understanding: no requests, no checkpoints. */
  replay?: boolean;
  onObjective(o: Objective): void;
  onExit?(): void;
}

/** Narrated kickoff: slides and captions driven by one playback clock, with a checkpoint after each segment. */
export function KickoffPlayer({ scenario, objective, prefs, replay = false, onObjective, onExit }: KickoffPlayerProps) {
  const segments = scenario.kickoff.segments;
  const count = segments.length;
  const { speed, captions } = prefs;
  const voice = scenario.npc.voice;

  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const resumeAt = resumeSegmentIndex(
      segments.map((s) => s.id),
      (id) => objective.noteVerdicts[id]?.accepted === true,
    );
    const resumeId = segments[resumeAt]?.id;
    return startState(replay, resumeAt, count, !!resumeId && objective.kickoffWatched.includes(resumeId));
  });

  const [failure, setFailure] = useState<Failure | null>(null);
  const [busy, setBusy] = useState(false);
  const [audioDone, setAudioDone] = useState(true);
  /** Each narration run gets a number. Callbacks from runs that were cancelled are ignored. */
  const runRef = useRef(0);
  /** Sentence index that the next narration run starts from (resume after pause). */
  const resumeRef = useRef(0);

  const segment: KickoffSegment | undefined = segments[state.index];
  const durationSec = segment ? estimateDurationSec(segment.transcript) : 0;
  const segmentText = segment?.transcript ?? "";
  const sentences = useMemo(() => splitSentences(segmentText), [segmentText]);
  const sentenceTiming = useMemo(() => sentenceSpans(sentences, durationSec), [sentences, durationSec]);
  const slideTiming = useMemo(() => (segment ? slideSpans(segment.slides, durationSec) : []), [segment, durationSec]);

  const elapsedSec = state.elapsedMs / 1000;
  const sentenceIdx = Math.max(0, activeSpanIndex(sentenceTiming, elapsedSec));
  const slideIdx = Math.max(0, activeSpanIndex(slideTiming, elapsedSec));
  const ticking = state.playing && state.stage === "watching" && segment !== undefined;

  // Playback clock. Speed scales how fast content time passes.
  useEffect(() => {
    if (!ticking) return;
    const id = window.setInterval(() => dispatch({ type: "tick", ms: TICK_MS * speed }), TICK_MS);
    return () => window.clearInterval(id);
  }, [ticking, speed]);

  // Narration: speak the rest of the segment from the resume sentence. Cleanup cancels the run.
  useEffect(() => {
    if (!ticking) return;
    const run = ++runRef.current;
    const text = splitSentences(segmentText).slice(resumeRef.current).join(" ");
    setAudioDone(false);
    speak(text, {
      voice: { ...voice, rate: voice.rate * speed },
      onEnd: () => {
        if (runRef.current === run) setAudioDone(true);
      },
    });
    return () => {
      runRef.current += 1;
      cancel();
    };
  }, [ticking, segmentText, speed, voice, state.epoch]);

  const timeUp = segment !== undefined && elapsedSec >= durationSec;
  const speechDone = audioDone || elapsedSec >= durationSec + NARRATION_GRACE_SEC;
  const segmentEnded = state.stage === "watching" && segment !== undefined && timeUp && speechDone;

  // A segment has ended: in live mode, record it as watched and open the checkpoint.
  useEffect(() => {
    if (!segmentEnded || !segment) return;
    if (replay) {
      dispatch({ type: "advance", count, end: "finished" });
      return;
    }
    dispatch({ type: "checkpoint" });
    if (objective.kickoffWatched.includes(segment.id)) return;
    api("POST /objectives/:id/kickoff/watched", { params: { id: objective.id }, body: { segmentId: segment.id } })
      .then(onObjective)
      .catch((e: unknown) => setFailure(failureFrom(e)));
  }, [segmentEnded, segment, replay, count, objective.id, objective.kickoffWatched, onObjective]);

  const togglePlay = () => {
    if (state.stage !== "watching") return;
    resumeRef.current = sentenceIdx;
    dispatch({ type: "play", on: !state.playing });
  };
  const restart = () => {
    resumeRef.current = 0;
    dispatch({ type: "restart" });
  };
  const changeSpeed = (next: Speed) => {
    resumeRef.current = sentenceIdx;
    prefs.setSpeed(next);
  };
  const goNext = () => {
    resumeRef.current = 0;
    dispatch({ type: "advance", count, end: "complete" });
  };

  const completeKickoff = async () => {
    setBusy(true);
    setFailure(null);
    try {
      onObjective(await api("POST /objectives/:id/kickoff/complete", { params: { id: objective.id } }));
    } catch (e) {
      setFailure(failureFrom(e));
    } finally {
      setBusy(false);
    }
  };

  const timeline: TimelineItem[] = scenario.kickoff.segments.map((seg, i) => {
    const dur = estimateDurationSec(seg.transcript);
    const fill =
      state.stage === "complete" || state.stage === "finished" || i < state.index
        ? 1
        : i === state.index
          ? state.stage === "watching"
            ? clamp01(elapsedSec / Math.max(1, dur))
            : 1
          : 0;
    return {
      id: seg.id,
      title: seg.title,
      ticks: boundaryFractions(slideSpans(seg.slides, dur), dur),
      fill,
      done: objective.noteVerdicts[seg.id]?.accepted === true,
      current: i === state.index && (state.stage === "watching" || state.stage === "checkpoint"),
    };
  });

  const sectionLabel = segment ? (NOTE_SECTIONS.find((s) => s.id === segment.noteSection)?.label ?? "Notes") : "";

  let body: ReactNode;
  if (state.stage === "complete") {
    body = <KickoffCompletion npcName={scenario.npc.name} busy={busy} failure={failure} onContinue={completeKickoff} />;
  } else if (state.stage === "finished") {
    body = (
      <section className="paper mx-auto flex max-w-[520px] flex-col items-center gap-4 p-10 text-center">
        <h2 className="font-serif text-[24px] font-medium text-ink">End of the kickoff replay</h2>
        <p className="text-[14px] text-muted">Nothing here is graded. Your notes stay as they are.</p>
        {onExit && (
          <Button variant="primary" size="lg" onClick={onExit}>
            Back to proof of understanding
          </Button>
        )}
      </section>
    );
  } else if (state.stage === "checkpoint" && segment) {
    body = (
      <CheckpointPanel
        key={segment.id}
        objective={objective}
        segment={segment}
        npc={scenario.npc}
        isLast={state.index === count - 1}
        onObjective={onObjective}
        onNext={goNext}
      />
    );
  } else if (segment) {
    body = (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex min-h-0 w-full flex-1 items-center justify-center" style={{ containerType: "size" }}>
          <div
            className="relative"
            style={{ width: "min(100cqw, calc(100cqh * 16 / 9))", aspectRatio: "16 / 9", containerType: "inline-size" }}
          >
            <SlideView key={slideIdx} slide={segment.slides[slideIdx]} title={segment.title} />
          </div>
        </div>
        {captions && <CaptionBar speaker={scenario.npc.name} text={sentences[sentenceIdx] ?? ""} />}
        <div className="flex flex-wrap items-center gap-3">
          <IconButton
            label={state.playing ? "Pause" : "Play"}
            variant="primary"
            size="md"
            onClick={togglePlay}
            icon={state.playing ? <Pause size={16} strokeWidth={2} /> : <Play size={16} strokeWidth={2} />}
          />
          <IconButton
            label="Restart this part"
            variant="ghost"
            size="md"
            onClick={restart}
            icon={<RotateCcw size={16} strokeWidth={1.75} />}
          />
          <MonoLabel className="tabular-nums text-muted">
            {formatClock(Math.floor(elapsedSec))} / {formatClock(Math.round(durationSec))}
          </MonoLabel>
          <span className="flex-1" />
          <MeetingToggles speed={speed} captions={captions} onSpeedChange={changeSpeed} onCaptionsChange={prefs.setCaptions} />
        </div>
      </div>
    );
  } else {
    body = null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-8 pt-4 pb-5">
      {segment && state.stage !== "complete" && state.stage !== "finished" && (
        <header className="flex shrink-0 items-end justify-between gap-4">
          <div className="min-w-0">
            <MonoLabel tone="accent">
              {replay ? "Replay" : "Kickoff"} · Part {state.index + 1} of {count} · {sectionLabel}
            </MonoLabel>
            <h2 className="truncate font-serif text-[24px] leading-tight font-medium text-ink">{segment.title}</h2>
          </div>
        </header>
      )}
      {failure && <ErrorNotice failure={failure} onRetry={state.stage === "complete" ? completeKickoff : undefined} />}
      <div className="flex min-h-0 flex-1 flex-col">{body}</div>
      <SegmentTimeline items={timeline} />
    </div>
  );
}
