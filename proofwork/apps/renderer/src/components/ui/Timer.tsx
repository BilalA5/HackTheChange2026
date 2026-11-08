import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export interface TimerProps {
  /** Starting value in seconds. Default 0. */
  initialSeconds?: number;
  /** Counting runs while true. Default true. */
  running?: boolean;
  /** Called on each whole second with the new total. */
  onTick?(totalSec: number): void;
  className?: string;
}

/** Counts up in mm:ss in mono type. */
export function Timer({ initialSeconds = 0, running = true, onTick, className }: TimerProps) {
  const [sec, setSec] = useState(initialSeconds);
  const tickRef = useRef(onTick);
  tickRef.current = onTick;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    tickRef.current?.(sec);
  }, [sec]);

  return (
    <time aria-live="off" className={cn("font-mono text-[13px] tabular-nums text-fg-muted", className)}>
      {formatClock(sec)}
    </time>
  );
}
