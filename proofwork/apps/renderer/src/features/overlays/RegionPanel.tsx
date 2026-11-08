import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";
import { Button } from "@/components/ui/Button";

export interface RegionPanelProps {
  count: number;
  max: number;
  question: string;
  onQuestionChange(value: string): void;
  onSubmit(): void;
  onCancel(): void;
}

const stop = (e: ReactPointerEvent<HTMLElement>) => e.stopPropagation();

/** Floating glass panel: the question and Send. Send is available once there is a question or a marked area. */
export function RegionPanel({ count, max, question, onQuestionChange, onSubmit, onCancel }: RegionPanelProps) {
  const canSend = question.trim() !== "" || count > 0;
  return (
    <form
      onPointerDown={stop}
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (canSend) onSubmit();
      }}
      className="glass absolute bottom-8 left-1/2 flex w-[460px] max-w-[calc(100vw-32px)] -translate-x-1/2 flex-col gap-3 p-4"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-[0.08em] text-fg-muted uppercase">I'm lost</span>
        <span className="font-mono text-[11px] text-fg-muted tabular-nums">
          {count} / {max} areas
        </span>
      </div>
      <label htmlFor="region-question" className="sr-only">
        What are you stuck on?
      </label>
      <input
        id="region-question"
        autoFocus
        value={question}
        onChange={(e) => onQuestionChange(e.target.value)}
        placeholder="What are you stuck on?"
        className="h-10 rounded-full border border-line bg-white/6 px-4 text-[14px] text-fg placeholder:text-fg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" disabled={!canSend}>
          Send
        </Button>
      </div>
    </form>
  );
}
