import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Fields";
import { MonoLabel } from "@/components/ui/Labels";
import type { StepProps } from "../types";

const MIN_CHARS = 3;

export function WhyStep({ view, busy, send }: StepProps) {
  const [text, setText] = useState("");
  const trimmed = text.trim();
  const valid = trimmed.length >= MIN_CHARS;
  const chips = view.chips ?? [];

  const submit = () => {
    if (!valid || busy) return;
    send({ kind: "WHY", text: trimmed });
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <section aria-labelledby="ftux-why-prompt" className="flex min-h-0 flex-1 flex-col items-center justify-center gap-7 overflow-y-auto py-4">
      <h1 id="ftux-why-prompt" className="max-w-[760px] text-center font-serif text-[36px] leading-tight font-medium text-fg">
        {view.prompt}
      </h1>

      <form onSubmit={onSubmit} className="glass flex w-full max-w-[640px] flex-col gap-4 rounded-glass p-5">
        <div className="flex flex-col gap-1.5">
          <MonoLabel>Motivation and background</MonoLabel>
          <Textarea
            aria-label="Your motivation and background"
            placeholder="Why this work matters to you, and what you already know: studies, a current job, projects, skills. A few sentences is plenty."
            value={text}
            disabled={busy}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={7}
            maxRows={14}
            className="min-h-[170px] text-[15px] leading-relaxed"
          />
        </div>

        {chips.length > 0 && (
          <div className="flex flex-col gap-2">
            <MonoLabel>Suggestions</MonoLabel>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Suggestions">
              {chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  disabled={busy}
                  onClick={() => setText(chip)}
                  className="rounded-full border border-line bg-white/8 px-3.5 py-1.5 text-left text-[13px] text-fg transition-colors hover:bg-white/14 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-45"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <span className="text-[12px] text-fg-muted">{valid ? "Ctrl or Cmd + Enter to submit" : `At least ${MIN_CHARS} characters`}</span>
          <Button type="submit" variant="light" size="md" disabled={!valid || busy} loading={busy}>
            Submit
          </Button>
        </div>
      </form>
    </section>
  );
}
