import { Plus, Trash2 } from "lucide-react";
import type { Npc } from "@pw/shared";
import { Button, IconButton, Input, MonoLabel, ProgressBar, Select, Textarea } from "@/components/ui";
import { NpcAvatar } from "@/components/domain";
import { pw } from "@/lib/bridge";
import { newUuid } from "@/lib/uuid";
import { cn } from "@/lib/cn";
import { tipFor, ringToneFor } from "./framing";
import { LiveVideo } from "./LiveVideo";
import type { MediaPrefs, MediaStreamState } from "./useMediaStream";
import type { FramingVerdict } from "./useSignals";
import { canRemoveSlide } from "./slides";
import type { OutlineSlide } from "./types";

const RING_CLASS: Record<ReturnType<typeof ringToneFor>, string> = {
  success: "border-success",
  warning: "border-warning",
  danger: "border-danger",
  neutral: "border-white/20",
};

const GUIDE_CLASS: Record<ReturnType<typeof ringToneFor>, string> = {
  success: "border-success/80",
  warning: "border-warning/80",
  danger: "border-danger/80",
  neutral: "border-white/40",
};

export interface SetupStageProps {
  npc: Npc;
  stageTitle: string;
  requirements: string[];
  instructions: string;
  deck: OutlineSlide[];
  onDeckChange(next: OutlineSlide[]): void;
  notes: string;
  onNotesChange(next: string): void;
  media: MediaStreamState;
  verdict: FramingVerdict;
  micLevel: number;
  prefs: MediaPrefs;
  onPrefsChange(next: MediaPrefs): void;
  onStart(): void;
  starting: boolean;
  startError: string | null;
}

/** Phase (a): camera preview, lighting check, devices, slide outline, speaker notes, start. */
export function SetupStage(props: SetupStageProps) {
  const { npc, deck, media, verdict, prefs } = props;
  const tone = ringToneFor(verdict.reason);
  const canStart = media.status === "ready" && deck.length > 0 && !props.starting;
  const denied = media.status === "denied" || media.status === "not_found" || media.status === "error";

  const updateSlide = (id: string, patch: Partial<Pick<OutlineSlide, "heading" | "bullets">>) =>
    props.onDeckChange(deck.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeSlide = (id: string) => props.onDeckChange(deck.filter((s) => s.id !== id));
  const addSlide = () => props.onDeckChange([...deck, { id: newUuid(), heading: "New slide", bullets: [""] }]);

  return (
    <div className="theme-night flex h-full min-h-0 flex-col bg-night text-fg">
      <header className="flex items-center justify-between gap-6 px-8 pt-6 pb-4">
        <div className="min-w-0">
          <MonoLabel tone="accent">Presentation / setup</MonoLabel>
          <h1 className="mt-1 truncate font-serif text-[28px] leading-tight">{props.stageTitle}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          {props.startError && <p role="alert" className="max-w-[320px] text-[13px] text-danger">{props.startError}</p>}
          {!canStart && !props.starting && (
            <p className="text-[13px] text-fg-muted">
              {deck.length === 0 ? "Add at least one slide." : "Allow camera and microphone to start."}
            </p>
          )}
          <Button size="lg" onClick={props.onStart} disabled={!canStart} loading={props.starting}>
            Start presenting
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 px-8 pb-6">
        <section aria-label="Camera and checks" className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-card bg-night-2">
            {media.stream ? (
              <LiveVideo stream={media.stream} label="Camera preview" />
            ) : (
              <div className="grid h-full place-items-center px-6 text-center text-[13px] text-muted-dark">
                {denied ? media.error : "Starting camera"}
              </div>
            )}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div
                className={cn("absolute rounded-[50%] border-2 border-dashed", GUIDE_CLASS[tone])}
                style={{ left: "20%", top: "0%", width: "60%", height: "84%" }}
              />
            </div>
          </div>

          {denied && (
            <div role="alert" className="glass flex flex-wrap items-center gap-3 p-4">
              <p className="min-w-0 flex-1 text-[13px] text-fg">{media.error}</p>
              <Button variant="glass" size="sm" onClick={media.retry}>
                Retry
              </Button>
              {pw.isElectron && (
                <Button variant="ghost" size="sm" onClick={() => void pw.capture.openPermissionSettings("camera")}>
                  Open camera settings
                </Button>
              )}
            </div>
          )}

          <div className="glass flex items-center gap-4 p-4">
            <span aria-hidden="true" className={cn("size-10 shrink-0 rounded-full border-[4px]", RING_CLASS[tone])} />
            <div className="min-w-0">
              <MonoLabel tone="accent">Lighting and framing check</MonoLabel>
              <p className="mt-1 text-[14px] text-fg">{tipFor(verdict.reason, verdict.ratio)}</p>
              <p className="mt-0.5 text-[12px] text-fg-muted">A brightness and centre check. It is not face detection.</p>
            </div>
          </div>

          <div className="glass flex flex-col gap-3 p-4">
            <MonoLabel>Microphone</MonoLabel>
            <ProgressBar value={props.micLevel} tone="success" label="Microphone level" />
          </div>

          <div className="glass grid grid-cols-2 gap-3 p-4">
            <Select
              label="Camera"
              value={prefs.cameraId ?? ""}
              onValueChange={(v) => props.onPrefsChange({ ...prefs, cameraId: v || undefined })}
              options={[{ value: "", label: "System default" }, ...media.devices.cameras.map((c) => ({ value: c.deviceId, label: c.label }))]}
            />
            <Select
              label="Microphone"
              value={prefs.micId ?? ""}
              onValueChange={(v) => props.onPrefsChange({ ...prefs, micId: v || undefined })}
              options={[{ value: "", label: "System default" }, ...media.devices.mics.map((m) => ({ value: m.deviceId, label: m.label }))]}
            />
          </div>

          <div className="glass flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <NpcAvatar name={npc.name} seed={npc.avatarSeed} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium">{npc.name}</p>
                <p className="truncate text-[12px] text-fg-muted">{npc.role}</p>
              </div>
            </div>
            <MonoLabel>What this presentation must cover</MonoLabel>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[13.5px] text-fg">
              {props.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            {props.instructions && <p className="text-[12.5px] text-fg-muted">{props.instructions}</p>}
          </div>
        </section>

        <section aria-label="Slides and notes" className="flex min-h-0 flex-col gap-4">
          <div className="flex items-center justify-between">
            <MonoLabel>Slide outline</MonoLabel>
            <Button variant="glass" size="sm" icon={<Plus size={14} strokeWidth={1.75} />} onClick={addSlide}>
              Add slide
            </Button>
          </div>
          <ol className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
            {deck.map((slide, i) => (
              <li key={slide.id} className="glass flex flex-col gap-2 p-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-dark tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <Input
                    aria-label={`Slide ${i + 1} heading`}
                    value={slide.heading}
                    onChange={(e) => updateSlide(slide.id, { heading: e.target.value })}
                    className="font-serif text-[17px]"
                  />
                  <IconButton
                    label={`Remove slide ${i + 1}`}
                    size="sm"
                    icon={<Trash2 size={14} strokeWidth={1.75} />}
                    disabled={!canRemoveSlide(deck.length)}
                    onClick={() => removeSlide(slide.id)}
                  />
                </div>
                <Textarea
                  aria-label={`Slide ${i + 1} bullets, one per line`}
                  value={slide.bullets.join("\n")}
                  onChange={(e) => updateSlide(slide.id, { bullets: e.target.value.split("\n") })}
                  rows={3}
                  placeholder="One bullet per line"
                />
              </li>
            ))}
          </ol>

          <Textarea
            label="Speaker notes"
            hint="Only you see these. They are shown in the transcript when on-device transcription is unavailable."
            value={props.notes}
            onChange={(e) => props.onNotesChange(e.target.value)}
            rows={4}
          />
        </section>
      </div>
    </div>
  );
}
