import { cn } from "@/lib/cn";
import { NO_DRAG_CLASS } from "./overlayHooks";

export interface PipTodo {
  id: string;
  text: string;
  done: boolean;
}

export interface PipTodosProps {
  todos: PipTodo[];
  busy: boolean;
  onToggle(id: string, done: boolean): void;
}

/** Stage to-dos as checkboxes. Scrolls inside its own box so the card keeps its height. */
export function PipTodos({ todos, busy, onToggle }: PipTodosProps) {
  if (todos.length === 0) {
    return <p className="text-[13px] text-fg-muted">No tasks for this stage yet.</p>;
  }
  return (
    <ul className="flex max-h-[150px] flex-col gap-1 overflow-y-auto pr-1" aria-label="Stage to-dos">
      {todos.map((t) => (
        <li key={t.id}>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-1 py-1 hover:bg-white/5">
            <input
              type="checkbox"
              checked={t.done}
              disabled={busy}
              onChange={(e) => onToggle(t.id, e.target.checked)}
              className={cn(NO_DRAG_CLASS, "mt-[3px] size-4 shrink-0 accent-accent")}
            />
            <span className={cn("text-[13px] leading-snug", t.done ? "text-fg-muted line-through" : "text-fg")}>{t.text}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
