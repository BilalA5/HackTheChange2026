import { useEffect, useId, useMemo, useState } from "react";
import { ChevronDown, Pause, Play } from "lucide-react";
import type { NpcVoice } from "@pw/shared";
import { cn } from "@/lib/cn";
import { cancel, speak, estimateDurationSec } from "@/lib/voice/tts";
import { NpcAvatar, seedHash } from "./NpcAvatar";

const BARS = 28;

/** Deterministic bar heights (0.3..1) so a bubble always draws the same waveform. */
function barHeights(seed: string): number[] {
  let h = seedHash(seed) || 1;
  return Array.from({ length: BARS }, () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return 0.3 + ((h >>> 0) % 70) / 100;
  });
}

export interface VoiceBubbleProps {
  side: "npc" | "learner";
  /** Speaker name. For side "npc" it labels the avatar. */
  name: string;
  /** Npc.avatarSeed (npc side only). */
  avatarSeed?: string;
  text: string;
  /** Per-speaker voice settings used by TTS. */
  voice?: Partial<NpcVoice>;
  /** Overrides the estimated duration. */
  durationSec?: number;
  autoPlay?: boolean;
  className?: string;
}

/**
 * A spoken message. The play button speaks the text with TTS. Bars animate while it plays.
 * The TRANSCRIPT toggle shows the text. The text is always in the DOM for assistive tech.
 */
export function VoiceBubble({ side, name, avatarSeed, text, voice, durationSec, autoPlay = false, className }: VoiceBubbleProps) {
  const [speaking, setSpeaking] = useState(false);
  const [showText, setShowText] = useState(false);
  const transcriptId = useId();
  const bars = useMemo(() => barHeights(text), [text]);
  const duration = durationSec ?? estimateDurationSec(text, voice?.rate ?? 1);
  const isNpc = side === "npc";

  const play = () => {
    if (speaking) {
      cancel();
      setSpeaking(false);
      return;
    }
    speak(text, {
      voice,
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
    });
  };

  useEffect(() => {
    if (autoPlay) play();
    // play only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => setSpeaking(false), []);

  const mm = Math.floor(duration / 60);
  const ss = String(duration % 60).padStart(2, "0");

  return (
    <div className={cn("flex w-full items-end gap-3", isNpc ? "justify-start" : "flex-row-reverse justify-start", className)}>
      {isNpc && <NpcAvatar name={name} seed={avatarSeed ?? name} size="sm" speaking={speaking} />}
      <div
        className={cn(
          "flex max-w-[640px] min-w-[280px] flex-col gap-2 rounded-[22px] px-4 py-3 shadow-[0_1px_0_rgb(0_0_0/0.04),0_10px_24px_-14px_rgb(30_25_10/0.35)]",
          isNpc ? "bg-white text-ink" : "bg-ink text-white",
        )}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={play}
            aria-label={speaking ? `Stop ${name}` : `Play ${name}`}
            aria-pressed={speaking}
            className={cn(
              "inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
              isNpc ? "bg-ink text-white hover:bg-ink/85" : "bg-white text-ink hover:bg-white/85",
            )}
          >
            {speaking ? <Pause size={14} strokeWidth={2} aria-hidden="true" /> : <Play size={14} strokeWidth={2} aria-hidden="true" />}
          </button>
          <div className="flex h-7 flex-1 items-center gap-[3px]" aria-hidden="true">
            {bars.map((b, i) => (
              <span
                key={i}
                className={cn("pw-wave-bar block w-[3px] flex-1 rounded-full", isNpc ? "bg-ink/70" : "bg-white/80")}
                data-idle={!speaking}
                style={{ height: `${Math.round(b * 100)}%`, ["--d" as string]: `${(i * 37) % 300}ms` }}
              />
            ))}
          </div>
          <span className={cn("font-mono text-[11px] tabular-nums", isNpc ? "text-ink/60" : "text-white/70")}>
            {mm}:{ss}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className={cn("font-mono text-[11px] tracking-[0.08em] uppercase", isNpc ? "text-ink/60" : "text-white/70")}>
            {name}
          </span>
          <button
            type="button"
            aria-expanded={showText}
            aria-controls={transcriptId}
            onClick={() => setShowText((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1 font-mono text-[11px] tracking-[0.08em] uppercase",
              isNpc ? "text-ink/60 hover:text-ink" : "text-white/70 hover:text-white",
            )}
          >
            Transcript
            <ChevronDown size={12} strokeWidth={2} className={cn("transition-transform", showText && "rotate-180")} aria-hidden="true" />
          </button>
        </div>
        <p id={transcriptId} hidden={!showText} className={cn("text-[14px] leading-relaxed", isNpc ? "text-ink/85" : "text-white/90")}>
          {text}
        </p>
      </div>
    </div>
  );
}
