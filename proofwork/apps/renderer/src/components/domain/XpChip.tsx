import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

export interface XpChipProps {
  amount: number;
  /** Held XP is locked until the Proof of Understanding is passed. */
  held?: boolean;
  className?: string;
}

/** "+150 XP" chip in XP gold. Held XP is shown dimmed with a lock hint in the title. */
export function XpChip({ amount, held = false, className }: XpChipProps) {
  return (
    <span
      title={held ? "Held: pass the Proof of Understanding to unlock" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[12px] font-semibold tabular-nums",
        held ? "bg-xp/8 text-xp/60" : "bg-xp/15 text-xp",
        className,
      )}
    >
      <Sparkles size={13} strokeWidth={1.75} aria-hidden="true" />
      {amount >= 0 ? "+" : ""}
      {amount} XP
    </span>
  );
}
