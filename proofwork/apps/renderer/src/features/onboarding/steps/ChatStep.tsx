import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Fields";
import { MonoLabel } from "@/components/ui/Labels";
import { NpcAvatar } from "@/components/domain/NpcAvatar";
import { cn } from "@/lib/cn";
import type { StepProps } from "../types";
import { VisionBoardCard } from "./VisionBoardCard";

const GUIDE_NAME = "Proofwork guide";
const GUIDE_SEED = "guide";

export function ChatStep({ view, busy, send }: StepProps) {
  const [text, setText] = useState("");
  const logRef = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();
  const messages = view.messages ?? [];
  const chips = view.chips ?? [];

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages.length, busy, reduce]);

  const submit = (raw: string) => {
    const t = raw.trim();
    if (!t || busy) return;
    send({ kind: "MESSAGE", text: t });
    setText("");
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit(text);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
      <section aria-labelledby="ftux-chat-prompt" className="glass flex min-h-[300px] min-w-0 flex-1 flex-col overflow-hidden rounded-glass lg:min-h-0">
        <header className="border-b border-line px-5 py-4">
          <MonoLabel tone="accent">Chat with the guide</MonoLabel>
          <h1 id="ftux-chat-prompt" className="mt-1 font-serif text-[22px] leading-snug font-medium text-fg">
            {view.prompt}
          </h1>
        </header>

        <div ref={logRef} role="log" aria-live="polite" aria-label="Conversation" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
          {messages.map((m) => {
            if (m.role === "system") {
              return (
                <p key={m.id} className="self-center text-center text-[12px] text-fg-muted">
                  {m.text}
                </p>
              );
            }
            const learner = m.role === "learner";
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={cn("flex items-end gap-2.5", learner && "flex-row-reverse")}
              >
                {!learner && <NpcAvatar name={GUIDE_NAME} seed={GUIDE_SEED} size="sm" />}
                <div className="flex max-w-[78%] flex-col gap-1">
                  {!learner && <span className="text-[12px] text-fg-muted">{GUIDE_NAME}</span>}
                  <p
                    className={cn(
                      "rounded-3xl px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap",
                      learner ? "rounded-br-lg bg-accent text-white" : "rounded-bl-lg bg-white/8 text-fg",
                    )}
                  >
                    {m.text}
                  </p>
                </div>
              </motion.div>
            );
          })}
          {busy && (
            <div className="flex items-end gap-2.5" aria-label="The guide is replying">
              <NpcAvatar name={GUIDE_NAME} seed={GUIDE_SEED} size="sm" speaking />
              <span className="flex gap-1 rounded-3xl rounded-bl-lg bg-white/8 px-4 py-3.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} aria-hidden className="size-1.5 animate-pulse rounded-full bg-fg-muted" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            </div>
          )}
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2 px-5 pb-3" role="group" aria-label="Quick replies">
            {chips.map((chip) => (
              <button
                key={chip}
                type="button"
                disabled={busy}
                onClick={() => submit(chip)}
                className="rounded-full border border-line bg-white/8 px-3.5 py-1.5 text-[13px] text-fg transition-colors hover:bg-white/14 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-45"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <Input
              aria-label="Message the guide"
              placeholder="Type your answer and press Enter"
              value={text}
              disabled={busy}
              onChange={(e) => setText(e.target.value)}
              autoComplete="off"
            />
          </div>
          <Button type="submit" variant="primary" size="md" disabled={busy || text.trim().length === 0} icon={<Send size={15} aria-hidden="true" />}>
            Send
          </Button>
        </form>
      </section>

      <VisionBoardCard board={view.board ?? {}} className="w-full shrink-0 lg:w-[300px]" />
    </div>
  );
}
