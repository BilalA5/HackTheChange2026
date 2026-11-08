import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "neutral" | "accent" | "xp" | "success" | "warning" | "danger";

const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-fg-muted",
  accent: "text-accent",
  xp: "text-xp",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

const TONE_BG: Record<Tone, string> = {
  neutral: "bg-white/8",
  accent: "bg-accent/15",
  xp: "bg-xp/15",
  success: "bg-success/15",
  warning: "bg-warning/15",
  danger: "bg-danger/15",
};

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  icon?: ReactNode;
}

/** Small rounded status chip. Renders as a span; wrap in a button for interactive pills. */
export function Pill({ tone = "neutral", icon, className, children, ...rest }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium",
        TONE_BG[tone],
        TONE_TEXT[tone],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}

export interface MonoLabelProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

/** UPPERCASE mono label (11px, tracked), for metrics and section tags such as "XP EARNED". */
export function MonoLabel({ tone = "neutral", className, ...rest }: MonoLabelProps) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] font-medium tracking-[0.08em] uppercase",
        TONE_TEXT[tone],
        className,
      )}
      {...rest}
    />
  );
}

/** Tiny count or status badge, e.g. the unread count or a "LOCKED" tag. */
export function Badge({ tone = "accent", className, children, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 font-mono text-[10px] leading-none font-semibold",
        tone === "accent" ? "bg-accent text-white" : TONE_BG[tone] + " " + TONE_TEXT[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
