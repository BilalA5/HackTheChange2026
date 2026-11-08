import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./Button";
import { trapFocus } from "./focus";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: "right" | "left";
  /** Panel width in px. Default 420. */
  width?: number;
  children: ReactNode;
  className?: string;
}

/** Side panel over the page, for longer forms and detail views. ESC closes. */
export function Sheet({ open, onClose, title, side = "right", width = 420, children, className }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "Tab" && panelRef.current) trapFocus(e, panelRef.current);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const fromX = side === "right" ? 24 : -24;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="sheet-scrim"
          className="fixed inset-0 z-50 bg-black/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : "Panel"}
            className={cn(
              "glass absolute top-3 bottom-3 flex flex-col overflow-hidden",
              side === "right" ? "right-3" : "left-3",
              className,
            )}
            style={{ width: Math.min(width, window.innerWidth - 24) }}
            initial={{ opacity: 0, x: fromX }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: fromX }}
            transition={{ duration: 0.26, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3 px-6 pt-5 pb-3">
              {title && (
                <h2 id={titleId} className="font-serif text-[22px] font-medium">
                  {title}
                </h2>
              )}
              <IconButton label="Close" size="sm" icon={<X size={16} strokeWidth={1.75} />} onClick={onClose} className="ml-auto" />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
