import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import type { SaveStatus } from "./settings/saver";

/** Shared layout pieces for the account panels. Tokens only, no raw colours. */

export function SettingsSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-serif text-[20px] font-medium text-fg">{title}</h3>
          {description && <p className="mt-1 text-[13px] text-fg-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SettingsGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-4 rounded-card border border-line bg-white/4 p-5", className)}>{children}</div>;
}

/** Label and hint on the left, control on the right. */
export function FieldRow({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <div className="text-[14px] text-fg">{label}</div>
        {hint && <div className="mt-0.5 text-[12px] text-fg-muted">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

/** Pill-shaped single choice. Each option is a radio. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: readonly SegmentOption<T>[];
  onChange(next: T): void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex items-center gap-1 rounded-full bg-white/6 p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-8 rounded-full px-4 text-[13px] font-medium transition-colors duration-200 disabled:opacity-45",
              on ? "bg-white text-ink" : "text-fg-muted hover:text-fg",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const SAVE_LABEL: Record<SaveStatus, string> = {
  idle: "",
  saving: "Saving",
  saved: "Saved",
  error: "Not saved",
};

/** Quiet "Saved" indicator for optimistic settings writes. Announced politely to screen readers. */
export function SaveIndicator({ status }: { status: SaveStatus }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px] font-medium tracking-[0.08em] uppercase transition-opacity duration-200",
        status === "error" ? "text-danger" : "text-fg-muted",
        status === "idle" && "opacity-0",
      )}
    >
      {status === "saved" && <Check size={12} strokeWidth={1.75} aria-hidden="true" className="text-success" />}
      {SAVE_LABEL[status]}
    </span>
  );
}

/** Confirmation card shown in place of a nested dialog. Nested Modals would fight over Escape and Tab. */
export function InlineConfirm({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  busy = false,
  danger = false,
  confirmDisabled = false,
  children,
}: {
  title: string;
  body?: string;
  confirmLabel: string;
  onConfirm(): void;
  onCancel(): void;
  busy?: boolean;
  danger?: boolean;
  confirmDisabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <div role="alertdialog" aria-label={title} className="flex flex-col gap-4 rounded-card border border-line bg-night/80 p-5">
      <div>
        <div className="font-serif text-[18px] font-medium text-fg">{title}</div>
        {body && <p className="mt-1 text-[13px] text-fg-muted">{body}</p>}
      </div>
      {children}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          size="sm"
          onClick={onConfirm}
          loading={busy}
          disabled={confirmDisabled}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}

/**
 * Local slider value that commits after the user pauses. Dragging moves the knob at once, and the
 * write happens once `delayMs` after the last change instead of on every tick.
 */
export function useDraftValue(committed: number, commit: (next: number) => void, delayMs = 400): [number, (next: number) => void] {
  const [draft, setDraft] = useState<number | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onChange = useCallback(
    (next: number) => {
      setDraft(next);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        commit(next);
        setDraft(null);
      }, delayMs);
    },
    [commit, delayMs],
  );

  return [draft ?? committed, onChange];
}
