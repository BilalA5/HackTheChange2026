import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { Slide } from "@pw/shared";
import { MonoLabel } from "@/components/ui/Labels";
import { clamp01 } from "../lib/timing";

export interface SlideViewProps {
  slide: Slide | undefined;
  /** Shown when the segment has no slides. */
  title: string;
}

/**
 * One slide on the 16:9 stage. Sizes use container units (cqw/cqh) so the slide scales with its stage.
 * The parent keys this component by slide index, so each slide animates in.
 */
export function SlideView({ slide, title }: SlideViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex h-full w-full flex-col justify-center gap-[2.4cqw] overflow-hidden rounded-[22px] bg-ink px-[6cqw] py-[4cqw] text-white shadow-[0_18px_40px_-20px_rgb(30_25_10/0.5)]"
    >
      {slide ? (
        <>
          <h3 className="font-serif leading-[1.08] font-medium text-white" style={{ fontSize: "min(5cqw, 52px)" }}>
            {slide.heading}
          </h3>
          <SlideVisual slide={slide} />
          {slide.bullets.length > 0 && (
            <ul className="flex flex-col gap-[1.2cqw] text-white/85" style={{ fontSize: "min(2.2cqw, 22px)" }}>
              {slide.bullets.map((b, i) => (
                <li key={i} className="flex gap-3">
                  <span aria-hidden="true" className="mt-[0.6em] size-[0.4em] shrink-0 rounded-full bg-accent" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <h3 className="font-serif text-white" style={{ fontSize: "min(5cqw, 52px)" }}>
          {title}
        </h3>
      )}
    </motion.div>
  );
}

function SlideVisual({ slide }: { slide: Slide }) {
  switch (slide.visual) {
    case "metric":
      if (!slide.metric) return null;
      return (
        <div className="flex flex-col gap-[0.8cqw]">
          <span className="font-serif leading-none font-semibold text-white" style={{ fontSize: "min(14cqw, 150px)" }}>
            {slide.metric.value}
          </span>
          <MonoLabel className="text-white/70">{slide.metric.label}</MonoLabel>
        </div>
      );
    case "quote":
      if (!slide.quote) return null;
      return (
        <figure className="flex flex-col gap-[1.2cqw]">
          <blockquote className="font-serif leading-snug text-white italic" style={{ fontSize: "min(4cqw, 40px)" }}>
            “{slide.quote.text}”
          </blockquote>
          <MonoLabel className="text-white/70">— {slide.quote.author}</MonoLabel>
        </figure>
      );
    case "flow": {
      const steps = slide.flow ?? [];
      if (steps.length === 0) return null;
      return (
        <ol className="flex flex-wrap items-center gap-2">
          {steps.map((step, i) => (
            <li key={`${step}-${i}`} className="flex items-center gap-2">
              <span className="rounded-full bg-white/10 px-4 py-2 font-mono text-[13px] text-white">{step}</span>
              {i < steps.length - 1 && <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" className="text-white/50" />}
            </li>
          ))}
        </ol>
      );
    }
    case "chart": {
      const rows = slide.chart ?? [];
      if (rows.length === 0) return null;
      return (
        <div className="flex flex-col gap-[1cqw]">
          {rows.map((row, i) => {
            const pct = Math.round(clamp01(row.value / 100) * 100);
            return (
              <div key={`${row.label}-${i}`} className="flex items-center gap-3">
                <span className="w-[32%] shrink-0 truncate text-white/80" style={{ fontSize: "min(1.9cqw, 18px)" }}>
                  {row.label}
                </span>
                <div role="img" aria-label={`${row.label}: ${row.value}`} className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-12 shrink-0 text-right font-mono text-[13px] text-white">{row.value}</span>
              </div>
            );
          })}
        </div>
      );
    }
    default:
      return null;
  }
}
