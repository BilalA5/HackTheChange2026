import { Check } from "lucide-react";
import { MonoLabel } from "@/components/ui/Labels";
import { clamp01 } from "../lib/timing";

export interface TimelineItem {
  id: string;
  title: string;
  /** Slide boundary positions, as fractions 0..1 of the segment. */
  ticks: number[];
  /** Progress through the segment, 0..1. */
  fill: number;
  /** Note accepted for this segment. */
  done: boolean;
  current: boolean;
}

/** Three segment bars, each with slide ticks and a progress fill. */
export function SegmentTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol aria-label="Kickoff progress" className="flex shrink-0 items-stretch gap-4">
      {items.map((item, i) => (
        <li key={item.id} aria-current={item.current ? "step" : undefined} className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <MonoLabel tone={item.current ? "accent" : "neutral"} className="truncate">
              {i + 1}. {item.title}
            </MonoLabel>
            {item.done && <Check size={14} strokeWidth={2} aria-label="Note accepted" className="shrink-0 text-success" />}
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-ink/10">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-200"
              style={{ width: `${clamp01(item.fill) * 100}%` }}
            />
            {item.ticks.map((t, j) => (
              <span key={j} aria-hidden="true" className="absolute top-0 h-full w-px bg-white/80" style={{ left: `${clamp01(t) * 100}%` }} />
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}
