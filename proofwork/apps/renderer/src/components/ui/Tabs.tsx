import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  value: T;
  onChange(id: T): void;
  orientation?: "horizontal" | "vertical";
  /** Accessible name of the tab list. */
  label: string;
  className?: string;
}

/** Tab strip (role=tablist). Arrow keys move focus, Home and End jump. The caller renders the panel content. */
export function Tabs<T extends string>({ tabs, value, onChange, orientation = "horizontal", label, className }: TabsProps<T>) {
  const baseId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const vertical = orientation === "vertical";

  const move = (from: number, dir: 1 | -1 | "home" | "end") => {
    const enabled = tabs.map((t, i) => (t.disabled ? -1 : i)).filter((i) => i >= 0);
    if (enabled.length === 0) return;
    let idx: number;
    if (dir === "home") idx = enabled[0];
    else if (dir === "end") idx = enabled[enabled.length - 1];
    else {
      const pos = enabled.indexOf(from);
      idx = enabled[(pos + dir + enabled.length) % enabled.length];
    }
    refs.current[idx]?.focus();
    onChange(tabs[idx].id);
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const nextKey = vertical ? "ArrowDown" : "ArrowRight";
    const prevKey = vertical ? "ArrowUp" : "ArrowLeft";
    if (e.key === nextKey) (e.preventDefault(), move(i, 1));
    else if (e.key === prevKey) (e.preventDefault(), move(i, -1));
    else if (e.key === "Home") (e.preventDefault(), move(i, "home"));
    else if (e.key === "End") (e.preventDefault(), move(i, "end"));
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      aria-orientation={orientation}
      className={cn(vertical ? "flex flex-col gap-1" : "flex items-center gap-1 rounded-full bg-white/6 p-1", className)}
    >
      {tabs.map((t, i) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${baseId}-${t.id}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={`${baseId}-panel-${t.id}`}
            tabIndex={selected ? 0 : -1}
            disabled={t.disabled}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "inline-flex items-center gap-2 text-[13px] font-medium transition-colors duration-200 disabled:opacity-40",
              vertical ? "h-9 w-full justify-start rounded-xl px-3" : "h-8 rounded-full px-4",
              selected ? "bg-white text-ink" : "text-fg-muted hover:text-fg",
            )}
          >
            {t.icon}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
