import { AnimatePresence, motion } from "motion/react";
import type { VisionBoard } from "@pw/shared";
import { MonoLabel } from "@/components/ui/Labels";
import { ProgressBar } from "@/components/ui/Progress";
import { cn } from "@/lib/cn";
import { BOARD_FIELDS, boardRows } from "../board";

export function VisionBoardCard({ board, className }: { board: Partial<VisionBoard>; className?: string }) {
  const rows = boardRows(board);
  const filled = rows.filter((r) => r.filled).length;

  return (
    <aside aria-label="Vision board" className={cn("glass flex min-h-0 flex-col gap-4 overflow-y-auto rounded-glass p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <MonoLabel tone="accent">Vision board</MonoLabel>
        <MonoLabel>
          {filled}/{BOARD_FIELDS.length}
        </MonoLabel>
      </div>
      <ProgressBar value={filled / BOARD_FIELDS.length} tone="accent" label="Vision board filled" />

      {board.drawingDataUrl && (
        <img src={board.drawingDataUrl} alt="Your drawing of your dream job" className="max-h-[150px] w-full rounded-2xl bg-white object-contain" />
      )}

      <dl className="flex flex-col gap-2">
        {rows.map((f) => (
          <div key={f.key} className="rounded-2xl border border-line bg-white/5 px-4 py-2.5">
            <dt>
              <MonoLabel>{f.label}</MonoLabel>
            </dt>
            <dd className="mt-0.5 min-h-[20px] text-[14px]">
              <AnimatePresence mode="wait" initial={false}>
                {f.filled ? (
                  <motion.span
                    key={f.value}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="block break-words text-fg"
                  >
                    {f.value}
                  </motion.span>
                ) : (
                  <span className="block italic text-fg-muted/60">{f.placeholder}</span>
                )}
              </AnimatePresence>
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
