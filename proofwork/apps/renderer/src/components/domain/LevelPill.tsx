import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { useUi } from "@/stores/ui";

export interface LevelPillProps {
  level: number;
  className?: string;
}

/** "L3" pill with a sparkle. Opens the "xp" panel. */
export function LevelPill({ level, className }: LevelPillProps) {
  const openPanel = useUi((s) => s.openPanel);
  return (
    <button
      type="button"
      onClick={() => openPanel("xp")}
      aria-label={`Level ${level}. Show XP details`}
      className={cn(
        "glass inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-mono text-[12px] font-semibold text-fg transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]",
        className,
      )}
    >
      <Sparkles size={14} strokeWidth={1.75} className="text-xp" aria-hidden="true" />
      L{level}
    </button>
  );
}
