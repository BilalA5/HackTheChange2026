import { motion } from "motion/react";
import type { CoworkTodo } from "@pw/shared";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { NO_DRAG_CLASS } from "./overlayHooks";

export interface IslandExpandedProps {
  /** Latest co-worker line, possibly still streaming. */
  npcText: string | null;
  streaming: boolean;
  todos: CoworkTodo[];
  onToggleTodo(id: string, done: boolean): void;
  onLost(): void;
  onShowMe(): void;
  onEnd(): void;
}

const MAX_TODOS = 3;

/** The grown island: the co-worker's last line, up to three to-dos and the help actions. */
export function IslandExpanded({ npcText, streaming, todos, onToggleTodo, onLost, onShowMe, onEnd }: IslandExpandedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex flex-col gap-3 px-4 pb-4"
    >
      <p aria-live="polite" className="min-h-[44px] text-[14px] leading-relaxed text-fg">
        {npcText ?? "Ask me anything, or say you're lost and I'll point at what you need."}
        {streaming && <span aria-hidden="true" className="ml-0.5 inline-block w-[2px] animate-pulse bg-fg align-middle">&nbsp;</span>}
      </p>

      {todos.length > 0 && (
        <ul aria-label="Co-worker to-dos" className="flex flex-col gap-1.5">
          {todos.slice(0, MAX_TODOS).map((t) => (
            <li key={t.id}>
              <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={(e) => onToggleTodo(t.id, e.target.checked)}
                  className={cn(NO_DRAG_CLASS, "size-4 accent-accent")}
                />
                <span className={t.done ? "text-fg-muted line-through" : "text-fg"}>{t.text}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <Button variant="glass" size="sm" className={NO_DRAG_CLASS} onClick={onLost}>
          I'm lost
        </Button>
        <Button variant="glass" size="sm" className={NO_DRAG_CLASS} onClick={onShowMe}>
          Show me
        </Button>
        <Button variant="ghost" size="sm" className={cn(NO_DRAG_CLASS, "ml-auto")} onClick={onEnd}>
          End
        </Button>
      </div>
    </motion.div>
  );
}
