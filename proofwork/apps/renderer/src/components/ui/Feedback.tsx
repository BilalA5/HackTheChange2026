import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SpinnerProps {
  size?: number;
  label?: string;
  className?: string;
}

export function Spinner({ size = 16, label = "Loading", className }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={cn("inline-flex", className)}>
      <svg width={size} height={size} viewBox="0 0 24 24" className="pw-spin" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" strokeWidth="2.5" className="stroke-current opacity-20" />
        <path d="M21 12a9 9 0 0 0-9-9" fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-current" />
      </svg>
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-xl bg-white/8", className)} />;
}

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-10 text-center", className)}>
      {icon && <div className="flex size-12 items-center justify-center rounded-full bg-white/8 text-fg-muted">{icon}</div>}
      <h3 className="font-serif text-[20px] font-medium text-fg">{title}</h3>
      {body && <p className="max-w-[360px] text-[14px] text-fg-muted">{body}</p>}
      {action}
    </div>
  );
}
