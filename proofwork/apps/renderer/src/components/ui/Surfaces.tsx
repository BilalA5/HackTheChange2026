import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Dark glass panel: blur, 1px line, 28px radius. */
export function GlassCard({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass p-5", className)} {...rest} />;
}

/** Warm paper card: white, 22px radius, soft shadow. Use inside .theme-paper screens. */
export function PaperCard({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("paper p-6", className)} {...rest} />;
}
