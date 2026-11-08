import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Tone } from "./Labels";

const BAR_TONE: Record<Tone, string> = {
  neutral: "bg-fg-muted",
  accent: "bg-accent",
  xp: "bg-xp",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

export interface ProgressBarProps {
  /** 0..1 */
  value: number;
  tone?: Tone;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, tone = "accent", label, className }: ProgressBarProps) {
  const v = clamp01(value);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/10", className)}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out", BAR_TONE[tone])} style={{ width: `${v * 100}%` }} />
    </div>
  );
}

export interface ProgressRingProps {
  /** 0..1 */
  value: number;
  size?: number;
  stroke?: number;
  tone?: Tone;
  label?: string;
  children?: ReactNode;
  className?: string;
}

export function ProgressRing({ value, size = 56, stroke = 4, tone = "accent", label, children, className }: ProgressRingProps) {
  const v = clamp01(value);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-white/10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          className={cn("transition-[stroke-dashoffset] duration-500 ease-out", tone === "xp" ? "stroke-xp" : tone === "success" ? "stroke-success" : "stroke-accent")}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}

export interface DotMeterProps {
  value: number;
  max: number;
  tone?: Tone;
  label?: string;
  className?: string;
}

/** Row of dots, filled up to value. Used for "Performance" and the 0..4 rubric scale. */
export function DotMeter({ value, max, tone = "accent", label, className }: DotMeterProps) {
  const filled = Math.round(Math.min(max, Math.max(0, value)));
  return (
    <div role="img" aria-label={label ?? `${filled} of ${max}`} className={cn("inline-flex items-center gap-1.5", className)}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn("size-2 rounded-full transition-colors duration-300", i < filled ? BAR_TONE[tone] : "bg-white/15")}
        />
      ))}
    </div>
  );
}
