import { Link } from "react-router";
import { RotateCcw, Send } from "lucide-react";
import type { Npc } from "@pw/shared";
import { Button, EmptyState, MonoLabel, Spinner, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDuration, targetState } from "./slides";

export type SubmitError =
  | { kind: "credits"; message: string }
  | { kind: "conflict"; message: string }
  | { kind: "generic"; message: string };

export interface ReviewStageProps {
  npc: Npc;
  recordingUrl: string | null;
  recordingError: string | null;
  durationSec: number;
  framingScore: number;
  slidesCovered: number;
  totalSlides: number;
  transcript: string;
  onTranscriptChange(next: string): void;
  submitting: boolean;
  submitError: SubmitError | null;
  onSubmit(): void;
  onRerecord(): void;
  onOpenCredits(): void;
  stageHref: string;
}

/** Phase (c): playback, the numbers, the editable transcript, and submit or re-record. */
export function ReviewStage(props: ReviewStageProps) {
  const state = targetState(props.durationSec);
  const stateText = { short: "Short of the 4 minute target", in_range: "Within the 4 to 8 minute target", long: "Over the 8 minute target" }[state];
  const framingPct = Math.round(props.framingScore * 100);

  return (
    <div className="theme-night flex h-full min-h-0 flex-col bg-night text-fg">
      <header className="px-8 pt-6 pb-4">
        <MonoLabel tone="accent">Presentation / review</MonoLabel>
        <h1 className="mt-1 font-serif text-[28px] leading-tight">Check your recording</h1>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6 px-8 pb-6">
        <section aria-label="Playback" className="flex min-h-0 flex-col gap-4 overflow-y-auto">
          {props.recordingUrl ? (
            <video
              key={props.recordingUrl}
              src={props.recordingUrl}
              controls
              playsInline
              aria-label="Recording playback"
              className="aspect-video w-full rounded-card bg-black"
            />
          ) : (
            <EmptyState
              title="No recording was saved"
              body={props.recordingError ?? "You can still submit the transcript you wrote."}
            />
          )}
          {props.recordingError && props.recordingUrl && (
            <p role="alert" className="text-[13px] text-warning">{props.recordingError}</p>
          )}

          <div className="grid grid-cols-3 gap-3">
            <Stat label="Duration" value={formatDuration(props.durationSec)} hint={stateText} />
            <Stat label="Framing" value={`${framingPct}%`} hint="Share of checks that were well lit and centred" />
            <Stat label="Slides covered" value={`${props.slidesCovered} / ${props.totalSlides}`} hint="Furthest slide reached" />
          </div>
        </section>

        <section aria-label="Transcript and submit" className="flex min-h-0 flex-col gap-4">
          <Textarea
            label="Transcript"
            hint="Edit it before you submit."
            value={props.transcript}
            onChange={(e) => props.onTranscriptChange(e.target.value)}
            className="min-h-0 flex-1"
            rows={12}
          />

          {props.submitError && (
            <div role="alert" className="glass flex flex-wrap items-center gap-3 p-4">
              <p className="min-w-0 flex-1 text-[13px] text-fg">
                {props.submitError.message}
                {props.submitError.kind === "conflict" && (
                  <>
                    {" "}
                    <Link to={props.stageHref} className="text-accent underline underline-offset-2 hover:text-accent-hover">
                      Go to the stage
                    </Link>
                  </>
                )}
              </p>
              {props.submitError.kind === "credits" && (
                <Button variant="glass" size="sm" onClick={props.onOpenCredits}>
                  Open credits
                </Button>
              )}
            </div>
          )}

          {props.submitting ? (
            <div role="status" className="glass flex items-center gap-3 p-4 text-[14px] text-fg">
              <Spinner size={16} label="Sending" />
              {props.npc.name} is watching your presentation…
            </div>
          ) : null}

          <div className={cn("flex items-center justify-between gap-3", props.submitting && "opacity-60")}>
            <Button variant="ghost" icon={<RotateCcw size={15} strokeWidth={1.75} />} onClick={props.onRerecord} disabled={props.submitting}>
              Re-record
            </Button>
            <Button
              size="lg"
              icon={<Send size={16} strokeWidth={1.75} />}
              onClick={props.onSubmit}
              loading={props.submitting}
              disabled={props.submitting}
            >
              Submit to {props.npc.name}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="glass flex flex-col gap-1 p-4">
      <MonoLabel>{label}</MonoLabel>
      <span className="font-mono text-[20px] tabular-nums">{value}</span>
      <span className="text-[11.5px] leading-snug text-fg-muted">{hint}</span>
    </div>
  );
}
