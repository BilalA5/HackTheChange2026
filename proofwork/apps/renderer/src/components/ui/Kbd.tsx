import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Keyboard key chip, e.g. <Kbd>Space</Kbd>. */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex min-w-6 items-center justify-center rounded-md border border-line bg-white/8 px-1.5 py-0.5 font-mono text-[11px] text-fg-muted",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
