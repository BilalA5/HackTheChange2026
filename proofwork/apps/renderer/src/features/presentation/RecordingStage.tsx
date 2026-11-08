import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Square } from "lucide-react";
import { Button, IconButton, MonoLabel, ProgressRing, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ringToneFor } from "./framing";
import { LiveVideo } from "./LiveVideo";
import { SlideCanvas } from "./SlideCanvas";
import { TARGET_MAX_SEC, formatDuration, slideCounter, targetState } from "./slides";
import type { FramingVerdict } from "./useSignals";
import type { FramingReason, OutlineSlide } from "./types";

const RING_CLASS: Record<ReturnType<typeof ringToneFor>, string> = {
  success: "border-success",
  warning: "border-warning",
  danger: "border-danger",
  neutral: "border-white/20",
};

const TARGET_TONE = { short: "warning", in_range: "success", long: "danger" } as const;
const TARGET_TEXT = { short: "Short of target", in_range: "On target", long: "Over target" } as const;

export interface RecordingStageProps {
  deck: OutlineSlide[];
  slideIndex: number;
  onGoto(index: number): void;
  elapsedSec: number;
  paused: boolean;
  stream: MediaStream | null;
  verdict: FramingVerdict;
  /** Camera overlay verdict, when the overlay is running. Preferred for the bubble ring. */
  overlayReason: FramingReason | null;
  stopping: boolean;
  onPause(): void;
  onResume(): void;
  onStop(): void;
  /** Live transcript mode (on-device speech) vs typed fallback. */
  sttAvailable: boolean;
  transcript: string;
  onTranscriptChange(next: string): void;
  partial: string;
  sttError: string | null;
}

/** Phase (b): big slide, camera bubble, timer on the 4-8 minute arc, transcript, pause and stop. */
export function RecordingStage(props: RecordingStageProps) {
  const { deck, slideIndex, elapsedSec, paused } = props;
  const current = deck[slideIndex];
  const total = deck.length;
  const state = targetState(elapsedSec);
  const bubbleTone = ringToneFor(props.overlayReason ?? props.verdict.reason);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [props.transcript, props.partial]);

  return (
    <div className="theme-night flex h-full min-h-0 flex-col bg-night text-fg">
      <header className="flex items-center gap-5 px-8 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <ProgressRing value={Math.min(1, elapsedSec / TARGET_MAX_SEC)} size={56} stroke={5} tone={TARGET_TONE[state]} label="Presentation time against the 4 to 8 minute target" />
          <div>
            <p className="font-mono text-[22px] leading-none tabular-nums" aria-live="off">
              {formatDuration(elapsedSec)}
            </p>
            <p className="mt-1 text-[12px] text-fg-muted">
              Target 4–8 min · {TARGET_TEXT[state]}
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5">
            <span aria-hidden="true" className={cn("size-2 rounded-full", paused ? "bg-warning" : "pw-rec-dot bg-danger")} />
            <MonoLabel tone={paused ? "warning" : "danger"}>{paused ? "Paused" : "Recording"}</MonoLabel>
          </span>
          <span className="font-mono text-[12px] text-muted-dark tabular-nums">{slideCounter(slideIndex, total)}</span>
          <IconButton
            label="Previous slide"
            icon={<ChevronLeft size={18} strokeWidth={1.75} />}
            disabled={slideIndex <= 0}
            onClick={() => props.onGoto(slideIndex - 1)}
          />
          <IconButton
            label="Next slide"
            icon={<ChevronRight size={18} strokeWidth={1.75} />}
            disabled={slideIndex >= total - 1}
            onClick={() => props.onGoto(slideIndex + 1)}
          />
          {paused ? (
            <Button variant="glass" icon={<Play size={15} strokeWidth={1.75} />} onClick={props.onResume} disabled={props.stopping}>
              Resume
            </Button>
          ) : (
            <Button variant="glass" icon={<Pause size={15} strokeWidth={1.75} />} onClick={props.onPause} disabled={props.stopping}>
              Pause
            </Button>
          )}
          <Button variant="danger" icon={<Square size={13} strokeWidth={1.75} fill="currentColor" />} onClick={props.onStop} loading={props.stopping}>
            Stop
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_300px] gap-4 px-8 pb-5">
        <div className="relative flex min-h-0 flex-col overflow-hidden rounded-glass bg-night-2">
          {current ? (
            <SlideCanvas slide={current} index={slideIndex} total={total} />
          ) : (
            <div className="grid flex-1 place-items-center text-fg-muted">No slides</div>
          )}

          {props.sttAvailable && props.partial && (
            <p aria-live="polite" className="absolute bottom-4 left-6 max-w-[60%] rounded-full bg-black/50 px-4 py-1.5 text-[14px] text-white/90 italic">
              {props.partial}
            </p>
          )}

          <div className={cn("absolute right-4 bottom-4 size-[168px] overflow-hidden rounded-full border-[4px] bg-night transition-colors duration-200", RING_CLASS[bubbleTone])}>
            {props.stream ? <LiveVideo stream={props.stream} label="Your camera bubble" /> : null}
          </div>
        </div>

        <aside aria-label="Transcript" className="glass flex min-h-0 flex-col gap-3 p-4">
          <MonoLabel>Transcript</MonoLabel>
          {props.sttAvailable ? (
            <>
              <div ref={transcriptRef} className="min-h-0 flex-1 overflow-y-auto text-[14px] leading-relaxed text-fg">
                {props.transcript ? props.transcript : <span className="text-muted-dark">Start speaking. Captions appear here.</span>}
              </div>
              {props.sttError && (
                <p role="alert" className="text-[12px] text-warning">
                  Transcription hit a problem: {props.sttError}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-[12.5px] text-fg-muted">
                On-device transcription needs the desktop app. Type or paste what you say here. It starts from your speaker notes.
              </p>
              <Textarea
                aria-label="Transcript"
                value={props.transcript}
                onChange={(e) => props.onTranscriptChange(e.target.value)}
                className="min-h-0 flex-1"
                autoGrow={false}
                rows={10}
              />
            </>
          )}
          <p className="text-[11px] text-muted-dark">Left and right arrow keys change slides.</p>
        </aside>
      </div>
    </div>
  );
}
