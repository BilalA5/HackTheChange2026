import { Captions, CaptionsOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { SPEEDS, type Speed } from "../lib/prefs";

export interface MeetingTogglesProps {
  speed: Speed;
  captions: boolean;
  onSpeedChange(next: Speed): void;
  onCaptionsChange(on: boolean): void;
}

/** Speed (1x, 1.25x, 1.5x) and captions toggles, shared by the lobby and the player. */
export function MeetingToggles({ speed, captions, onSpeedChange, onCaptionsChange }: MeetingTogglesProps) {
  return (
    <div className="flex items-center gap-2">
      <div role="group" aria-label="Playback speed" className="flex items-center rounded-full bg-ink/5 p-0.5">
        {SPEEDS.map((s) => {
          const active = s === speed;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              onClick={() => onSpeedChange(s)}
              className={cn(
                "h-7 rounded-full px-2.5 font-mono text-[11px] font-medium transition-colors",
                active ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
              )}
            >
              {s}×
            </button>
          );
        })}
      </div>
      <button
        type="button"
        aria-pressed={captions}
        onClick={() => onCaptionsChange(!captions)}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-mono text-[11px] font-medium tracking-[0.06em] uppercase transition-colors",
          captions ? "bg-ink text-white" : "bg-ink/5 text-muted hover:text-ink",
        )}
      >
        {captions ? <Captions size={14} strokeWidth={1.75} aria-hidden="true" /> : <CaptionsOff size={14} strokeWidth={1.75} aria-hidden="true" />}
        Captions
      </button>
    </div>
  );
}
