// XP panel: level, progress to the next level, held XP, streak, the level ladder and recent XP events.
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { LEVEL_THRESHOLDS } from "@pw/shared";
import { useProgress } from "@/stores/progress";
import type { PanelProps } from "@/stores/ui";
import { Button, IconButton } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Feedback";
import { MonoLabel, Pill } from "@/components/ui/Labels";
import { XpChip } from "@/components/domain/XpChip";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { relativeTime } from "./model";

const fmt = (n: number) => n.toLocaleString("en-US");

export default function XpPopover({ onClose }: PanelProps) {
  const reduced = useReducedMotion() ?? false;
  const data = useProgress((s) => s.data);
  const loading = useProgress((s) => s.loading);
  const error = useProgress((s) => s.error);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    void useProgress.getState().refresh();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const events = data ? [...data.events].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8) : [];

  return (
    <div className="fixed inset-0 z-50" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.section
        role="dialog"
        aria-label="XP and level"
        className="glass fixed top-14 right-5 flex max-h-[calc(100vh-88px)] w-[360px] flex-col overflow-hidden"
        initial={{ opacity: 0, y: reduced ? 0 : -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          <MonoLabel>Progress</MonoLabel>
          <IconButton label="Close" size="sm" icon={<X size={16} strokeWidth={1.75} />} onClick={onClose} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {!data ? (
            error && !loading ? (
              <div className="flex flex-col gap-3 py-6">
                <p className="text-[14px] text-fg-muted">Could not load your XP. {errorMessage(error)}</p>
                <Button variant="glass" size="sm" onClick={() => void useProgress.getState().refresh()} className="self-start">
                  Try again
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 py-4" aria-busy="true">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-40 w-full" />
              </div>
            )
          ) : (
            <>
              <div className="flex items-center gap-5">
                <ProgressRing value={data.ratio} size={92} stroke={6} tone="xp" label={`${Math.round(data.ratio * 100)}% to next level`}>
                  <span className="font-mono text-[13px] font-semibold">L{data.level}</span>
                </ProgressRing>
                <div className="min-w-0">
                  <h2 className="font-serif text-[26px] leading-tight font-medium">Level {data.level}</h2>
                  <p className="mt-1 font-mono text-[14px] font-semibold text-xp tabular-nums">{fmt(data.xp)} XP</p>
                  <p className="mt-0.5 text-[13px] text-fg-muted">
                    {data.nextThreshold === null
                      ? "Max level"
                      : `${fmt(data.xpToNext)} XP to Level ${data.level + 1}`}
                  </p>
                </div>
              </div>

              {data.heldXp > 0 && (
                <div className="mt-4 rounded-2xl bg-xp/10 p-3.5 text-[13px] leading-relaxed">
                  <span className="font-semibold text-xp">{fmt(data.heldXp)} XP waiting.</span>{" "}
                  <span className="text-fg-muted">Prove you understood the brief to unlock them.</span>
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/5 p-3">
                  <MonoLabel>Current streak</MonoLabel>
                  <p className="mt-1 font-mono text-[18px] font-semibold tabular-nums">{data.streak.current}</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <MonoLabel>Best streak</MonoLabel>
                  <p className="mt-1 font-mono text-[18px] font-semibold tabular-nums">{data.streak.best}</p>
                </div>
              </div>

              <section aria-labelledby="xp-ladder" className="mt-5">
                <h3 id="xp-ladder" className="mb-2">
                  <MonoLabel>Level ladder</MonoLabel>
                </h3>
                <table className="w-full text-[13px]">
                  <thead className="sr-only">
                    <tr>
                      <th scope="col">Level</th>
                      <th scope="col">Total XP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LEVEL_THRESHOLDS.slice(1).map((xp, i) => {
                      const level = i + 1;
                      const current = level === data.level;
                      return (
                        <tr
                          key={level}
                          aria-current={current ? "true" : undefined}
                          className={cn("border-t border-line", current && "bg-accent/15 text-fg")}
                        >
                          <th scope="row" className={cn("py-2 pl-3 text-left font-mono font-medium", !current && "text-fg-muted")}>
                            L{level}
                            {current && <span className="ml-2 text-[11px] text-accent">You are here</span>}
                          </th>
                          <td className={cn("py-2 pr-3 text-right font-mono tabular-nums", !current && "text-fg-muted")}>{fmt(xp)} XP</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>

              <section aria-labelledby="xp-events" className="mt-5">
                <h3 id="xp-events" className="mb-2">
                  <MonoLabel>Recent XP</MonoLabel>
                </h3>
                {events.length === 0 ? (
                  <p className="text-[13px] text-fg-muted">No XP yet. Finish a step of a project to earn some.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-line">
                    {events.map((ev) => (
                      <li key={ev.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-[13px]">{ev.reason}</p>
                          <p className="text-[12px] text-fg-muted">{relativeTime(ev.createdAt, now)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {ev.held && <Pill tone="neutral" className="px-2 py-0.5 text-[11px]">Held</Pill>}
                          <XpChip amount={ev.amount} held={ev.held} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </motion.section>
    </div>
  );
}
