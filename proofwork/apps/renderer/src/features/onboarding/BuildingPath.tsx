// "Building your path": the wait while the server writes a personal path (30–90 s with a live model).
// Full-screen in onboarding, compact inside Settings. The checklist advances on a timer, not on server progress.
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { MonoLabel } from "@/components/ui/Labels";
import { cn } from "@/lib/cn";
import { activeBuildingStep, buildingRoleTitle, buildingSteps, BUILD_STEP_MS } from "./building";

const TICK_MS = 500;

export interface BuildingPathProps {
  /** Learner's industry, named in the first checklist item. */
  industry?: string | null;
  /** Target role, shown as the title being built. */
  roleTitle?: string | null;
  /** Compact layout for Settings. Full-screen when omitted. */
  compact?: boolean;
  className?: string;
}

/** Ticks while mounted and returns elapsed milliseconds since mount. */
function useElapsed(): number {
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, []);
  return now - start;
}

export function BuildingPath({ industry, roleTitle, compact = false, className }: BuildingPathProps) {
  const reduce = useReducedMotion();
  const elapsed = useElapsed();
  const steps = buildingSteps(industry ?? "");
  const active = activeBuildingStep(elapsed, steps.length, BUILD_STEP_MS);
  const title = buildingRoleTitle(roleTitle);

  return (
    <section
      role="status"
      aria-live="polite"
      aria-label="Building your path"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-4 rounded-card border border-line bg-white/4 px-6 py-6" : "gap-7 px-8",
        className,
      )}
    >
      <div className={cn("relative flex items-center justify-center", compact ? "size-14" : "size-24")} aria-hidden="true">
        <motion.span
          className="absolute inset-0 rounded-full border border-accent/40"
          animate={reduce ? undefined : { scale: [1, 1.25, 1], opacity: [0.6, 0.15, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <svg width={compact ? 22 : 34} height={compact ? 22 : 34} viewBox="0 0 24 24" className="pw-spin text-accent" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" strokeWidth="2.5" className="stroke-current opacity-20" />
          <path d="M21 12a9 9 0 0 0-9-9" fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-current" />
        </svg>
      </div>

      <div className="flex flex-col gap-2">
        <MonoLabel tone="accent">Building your path</MonoLabel>
        <p className={cn("font-serif leading-tight font-medium text-fg", compact ? "text-[20px]" : "text-[34px]")}>{title}</p>
        {!compact && <p className="text-[14px] text-fg-muted">This takes a minute. Every company, manager and brief is written for you.</p>}
      </div>

      <ol className={cn("flex flex-col text-left", compact ? "gap-1.5 text-[13px]" : "gap-2.5 text-[15px]")} aria-label="Progress">
        {steps.map((label, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <li key={label} className={cn("flex items-center gap-3 transition-colors duration-300", done ? "text-fg-muted" : current ? "text-fg" : "text-fg-muted/40")}>
              <span className="flex size-5 shrink-0 items-center justify-center" aria-hidden="true">
                <AnimatePresence initial={false} mode="wait">
                  {done ? (
                    <motion.span
                      key="done"
                      initial={reduce ? false : { scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex size-5 items-center justify-center rounded-full bg-success/20 text-success"
                    >
                      <Check size={12} strokeWidth={2.25} />
                    </motion.span>
                  ) : current ? (
                    <motion.span
                      key="current"
                      animate={reduce ? undefined : { opacity: [0.35, 1, 0.35] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                      className="size-2 rounded-full bg-accent"
                    />
                  ) : (
                    <span key="todo" className="size-2 rounded-full bg-white/20" />
                  )}
                </AnimatePresence>
              </span>
              <span>{label}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
