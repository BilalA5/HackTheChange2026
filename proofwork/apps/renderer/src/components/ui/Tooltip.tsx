import { cloneElement, isValidElement, useId, useState, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TooltipProps {
  content: ReactNode;
  /** A single element. Its aria-describedby is set to the tooltip id. */
  children: ReactElement<Record<string, unknown>>;
  side?: "top" | "bottom";
  delayMs?: number;
  className?: string;
}

/** Hover and focus tooltip. Shows after delayMs and hides on blur, leave or Escape. */
export function Tooltip({ content, children, side = "bottom", delayMs = 350, className }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => setOpen(true), delayMs));
  };
  const hide = () => {
    if (timer) clearTimeout(timer);
    setTimer(null);
    setOpen(false);
  };

  if (!isValidElement(children)) return children;
  const trigger = cloneElement(children, {
    "aria-describedby": open ? id : undefined,
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    },
  });

  return (
    <span className="relative inline-flex">
      {trigger}
      {open && (
        <span
          id={id}
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 rounded-lg bg-night-2 px-2.5 py-1.5 text-[12px] whitespace-nowrap text-fg shadow-lg",
            side === "top" ? "bottom-full mb-2" : "top-full mt-2",
            className,
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
