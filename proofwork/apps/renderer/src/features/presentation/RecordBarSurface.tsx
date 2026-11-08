import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Square } from "lucide-react";
import { IconButton } from "@/components/ui";
import { pw } from "@/lib/bridge";
import { formatDuration } from "./slides";
import { parseRecordBarState, type RecordBarCommand, type RecordBarState } from "./overlayLink";
import "./overlay.css";

/**
 * Floating record bar overlay (380x64). Shows the recording state broadcast by the presentation page.
 * Buttons send "recordbar:command". The pill is a drag region, and the buttons are no-drag.
 */
export default function RecordBarSurface() {
  const [state, setState] = useState<RecordBarState | null>(null);

  useEffect(() => {
    return pw.overlay.onMessage((msg) => {
      if (msg.channel !== "recordbar:state") return;
      const next = parseRecordBarState(msg.data);
      if (next) setState(next);
    });
  }, []);

  const send = (cmd: RecordBarCommand) => pw.overlay.broadcast("recordbar:command", { cmd });
  const paused = state?.paused ?? false;
  const slides = state?.slides ?? 0;
  const slideLabel = state && slides > 0 ? `${Math.min(state.slide + 1, slides)}/${slides}` : "-";

  return (
    <div className="pw-drag flex h-full w-full items-center">
      <div className="glass flex h-full w-full items-center gap-2 rounded-full pr-2 pl-4">
        <span
          aria-hidden="true"
          className={paused ? "size-2.5 shrink-0 rounded-full bg-warning" : "pw-rec-dot size-2.5 shrink-0 rounded-full bg-danger"}
        />
        <span className="font-mono text-[11px] tracking-[0.08em] text-muted-dark uppercase">{paused ? "Paused" : "Rec"}</span>
        <span className="font-mono text-[14px] tabular-nums" aria-live="off">
          {formatDuration(state?.elapsedSec ?? 0)}
        </span>
        <span className="font-mono text-[12px] tabular-nums text-muted-dark" title="Slide">
          {slideLabel}
        </span>
        <div className="pw-nodrag ml-auto flex items-center gap-0.5">
          <IconButton
            label="Previous slide"
            size="sm"
            icon={<ChevronLeft size={16} strokeWidth={1.75} />}
            onClick={() => send("prev")}
          />
          <IconButton
            label="Next slide"
            size="sm"
            icon={<ChevronRight size={16} strokeWidth={1.75} />}
            onClick={() => send("next")}
          />
          <IconButton
            label={paused ? "Resume recording" : "Pause recording"}
            size="sm"
            icon={paused ? <Play size={15} strokeWidth={1.75} /> : <Pause size={15} strokeWidth={1.75} />}
            onClick={() => send(paused ? "resume" : "pause")}
          />
          <IconButton
            label="Stop and review"
            size="sm"
            variant="danger"
            icon={<Square size={13} strokeWidth={1.75} fill="currentColor" />}
            onClick={() => send("stop")}
          />
        </div>
      </div>
    </div>
  );
}
