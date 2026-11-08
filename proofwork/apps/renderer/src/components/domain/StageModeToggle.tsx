import type { StageMode } from "@pw/shared";
import { cn } from "@/lib/cn";

const MODES: { id: StageMode; label: string; hint: string }[] = [
  { id: "plan", label: "Plan", hint: "Agree the requirements with your manager" },
  { id: "do", label: "Do", hint: "Build the work in your own tools" },
  { id: "learn", label: "Learn", hint: "Short trainings for this stage" },
];

export interface StageModeToggleProps {
  value: StageMode;
  onChange(mode: StageMode): void;
  disabled?: boolean;
  className?: string;
}

/** Plan / Do / Learn segmented control (radiogroup with arrow-key support). */
export function StageModeToggle({ value, onChange, disabled, className }: StageModeToggleProps) {
  const move = (dir: 1 | -1) => {
    const i = MODES.findIndex((m) => m.id === value);
    const next = MODES[(i + dir + MODES.length) % MODES.length];
    onChange(next.id);
  };
  return (
    <div
      role="radiogroup"
      aria-label="Stage mode"
      className={cn("inline-flex items-center gap-1 rounded-full bg-white/8 p-1", className)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") (e.preventDefault(), move(1));
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") (e.preventDefault(), move(-1));
      }}
    >
      {MODES.map((m) => {
        const selected = m.id === value;
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${m.label}: ${m.hint}`}
            title={m.hint}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(m.id)}
            className={cn(
              "h-8 rounded-full px-4 font-mono text-[11px] font-medium tracking-[0.08em] uppercase transition-colors duration-200 disabled:opacity-45",
              selected ? "bg-white text-ink" : "text-fg-muted hover:text-fg",
            )}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
