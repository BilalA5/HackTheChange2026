import { motion } from "motion/react";
import { Bell, CircleCheck, CircleX, TriangleAlert, Zap, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { HudNotice } from "./hudQueue";
import type { HudTone } from "./overlayMessages";

const ICON: Record<HudTone, LucideIcon> = {
  neutral: Bell,
  success: CircleCheck,
  xp: Zap,
  warning: TriangleAlert,
  danger: CircleX,
};

const ICON_TONE: Record<HudTone, string> = {
  neutral: "text-fg-muted",
  success: "text-success",
  xp: "text-xp",
  warning: "text-warning",
  danger: "text-danger",
};

export interface HudToastProps {
  notice: HudNotice;
  reduced: boolean;
}

/** One glass toast. Its own key (the notice id) makes AnimatePresence play the exit for each notice. */
export function HudToast({ notice, reduced }: HudToastProps) {
  const Icon = ICON[notice.tone];
  const duration = reduced ? 0 : 0.22;
  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration, ease: "easeOut" }}
      className="glass flex h-[56px] w-[400px] items-center gap-3 px-4"
    >
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full bg-white/8", ICON_TONE[notice.tone])}>
        <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-fg">{notice.title}</p>
        {notice.body && <p className="truncate text-[12px] text-fg-muted">{notice.body}</p>}
      </div>
    </motion.div>
  );
}
