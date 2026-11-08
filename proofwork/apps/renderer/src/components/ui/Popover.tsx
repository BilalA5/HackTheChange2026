import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";

export type PopoverPlacement = "bottom-end" | "bottom-start" | "top-end" | "top-start";

export interface PopoverProps {
  open: boolean;
  onClose: () => void;
  /** Element the popover hangs off. */
  anchorRef: RefObject<HTMLElement | null>;
  placement?: PopoverPlacement;
  /** Accessible name for the dialog. */
  label: string;
  children: ReactNode;
  className?: string;
  /** Width in px. Default 340. */
  width?: number;
}

/** Anchored glass panel, portalled to body. Closes on outside click and ESC. Re-positions on resize and scroll. */
export function Popover({ open, onClose, anchorRef, placement = "bottom-end", label, children, className, width = 340 }: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const a = anchorRef.current?.getBoundingClientRect();
      if (!a) return;
      const h = panelRef.current?.offsetHeight ?? 0;
      const top = placement.startsWith("top") ? a.top - h - 8 : a.bottom + 8;
      const left = placement.endsWith("end") ? a.right - width : a.left;
      setPos({
        top: Math.max(8, Math.min(top, window.innerHeight - h - 8)),
        left: Math.max(8, Math.min(left, window.innerWidth - width - 8)),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef, placement, width]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  return createPortal(
    <AnimatePresence>
      {open && pos && (
        <motion.div
          key="popover"
          ref={panelRef}
          role="dialog"
          aria-label={label}
          className={cn("glass fixed z-40 p-4", className)}
          style={{ top: pos.top, left: pos.left, width }}
          initial={{ opacity: 0, y: placement.startsWith("top") ? 6 : -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
