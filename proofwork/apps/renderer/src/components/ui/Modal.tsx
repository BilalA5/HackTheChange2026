import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { IconButton } from "./Button";
import { X } from "lucide-react";
import { trapFocus } from "./focus";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Hides the title visually while keeping it for screen readers. */
  hideTitle?: boolean;
  children: ReactNode;
  className?: string;
  /** Max width class. Default max-w-[560px]. */
  widthClass?: string;
}

/** Centred glass dialog with a scrim. ESC closes, Tab stays inside, focus returns to the opener. */
export function Modal({ open, onClose, title, hideTitle, children, className, widthClass = "max-w-[560px]" }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("input,textarea,select,button,[tabindex]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "Tab" && panel) {
        trapFocus(e, panel);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="scrim"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-6 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : "Dialog"}
            className={cn("glass flex max-h-[85vh] w-full flex-col overflow-hidden", widthClass, className)}
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-2">
              {title && (
                <h2 id={titleId} className={cn("font-serif text-[22px] font-medium", hideTitle && "sr-only")}>
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
