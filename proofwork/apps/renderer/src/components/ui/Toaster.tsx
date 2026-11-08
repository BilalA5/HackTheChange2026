import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToasts, toast, type ToastItem, type ToastTone } from "@/stores/toasts";
import { IconButton } from "./Button";

export { toast };
export type { ToastTone };

const ACCENT: Record<ToastTone, string> = {
  neutral: "bg-fg-muted",
  success: "bg-success",
  xp: "bg-xp",
  warning: "bg-warning",
  danger: "bg-danger",
};

function ToastCard({ item }: { item: ToastItem }) {
  const dismiss = useToasts((s) => s.dismiss);
  useEffect(() => {
    const t = setTimeout(() => dismiss(item.id), item.ttlMs);
    return () => clearTimeout(t);
  }, [item.id, item.ttlMs, dismiss]);

  return (
    <motion.div
      layout
      role="status"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="glass pointer-events-auto flex w-[320px] items-start gap-3 p-4"
    >
      <span aria-hidden="true" className={cn("mt-1.5 size-2 shrink-0 rounded-full", ACCENT[item.tone])} />
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium text-fg">{item.title}</div>
        {item.body && <div className="mt-0.5 text-[12.5px] text-fg-muted">{item.body}</div>}
      </div>
      <IconButton label="Dismiss notification" size="sm" icon={<X size={14} strokeWidth={1.75} />} onClick={() => dismiss(item.id)} />
    </motion.div>
  );
}

/** Renders the toast stack bottom-right. Mount once per window. */
export function Toaster() {
  const items = useToasts((s) => s.items);
  return (
    <div aria-live="polite" className="pointer-events-none fixed right-5 bottom-5 z-[60] flex flex-col-reverse gap-2">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <ToastCard key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}
