import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, GraduationCap, Send, X } from "lucide-react";
import type { LearnItem, Npc, Stage, StageProgress } from "@pw/shared";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Fields";
import { Markdown } from "@/components/ui/Markdown";
import { cn } from "@/lib/cn";
import { ChatBubble, TypingIndicator } from "./ChatBubble";

export interface LearnViewProps {
  stage: Stage;
  progress: StageProgress;
  npc: Npc;
  /** Item to open first, e.g. from a rail resource click. */
  focusItemId: string | null;
  onComplete(itemId: string): Promise<void>;
  onChat(message: string): Promise<void>;
  onError(e: unknown): void;
}

/** Learn mode on paper: micro-trainings with a check question, plus a tutor chat. */
export function LearnView({ stage, progress, npc, focusItemId, onComplete, onChat, onError }: LearnViewProps) {
  const items = stage.learn;
  const [selectedId, setSelectedId] = useState<string | null>(focusItemId ?? items[0]?.id ?? null);
  useEffect(() => {
    if (focusItemId) setSelectedId(focusItemId);
  }, [focusItemId]);
  const selected = items.find((i) => i.id === selectedId) ?? null;

  if (items.length === 0) {
    return <p className="p-6 text-[14px] text-muted italic">No trainings for this stage.</p>;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <section aria-label="Trainings" className="flex flex-col gap-2">
        <h2 className="font-serif text-[22px] font-medium text-ink">Trainings for this stage</h2>
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const done = progress.learnCompleted.includes(item.id);
            const active = item.id === selectedId;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "paper flex w-full items-center gap-3 px-5 py-4 text-left transition-shadow duration-200",
                    active && "ring-2 ring-accent/40",
                  )}
                >
                  <GraduationCap size={18} strokeWidth={1.75} className="text-muted" aria-hidden="true" />
                  <span className="min-w-0 flex-1 font-serif text-[16px] font-medium text-ink">{item.title}</span>
                  <span className="font-mono text-[11px] text-muted">{item.minutes} min</span>
                  {done && <Check size={16} strokeWidth={2} className="text-success" aria-label="Completed" />}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {selected && (
        <LessonDetail
          key={selected.id}
          item={selected}
          completed={progress.learnCompleted.includes(selected.id)}
          onComplete={onComplete}
          onError={onError}
        />
      )}

      <TutorChat progress={progress} npc={npc} onChat={onChat} onError={onError} />
    </div>
  );
}

interface LessonDetailProps {
  item: LearnItem;
  completed: boolean;
  onComplete(itemId: string): Promise<void>;
  onError(e: unknown): void;
}

function LessonDetail({ item, completed, onComplete, onError }: LessonDetailProps) {
  const [completing, setCompleting] = useState(false);
  const complete = async () => {
    setCompleting(true);
    try {
      await onComplete(item.id);
    } catch (e) {
      onError(e);
    } finally {
      setCompleting(false);
    }
  };
  return (
    <article aria-label={item.title} className="paper flex flex-col gap-5 p-6">
      <header className="flex flex-wrap items-baseline gap-3">
        <h3 className="font-serif text-[22px] font-medium text-ink">{item.title}</h3>
        <span className="font-mono text-[11px] tracking-[0.06em] text-muted uppercase">{item.minutes} min</span>
      </header>
      <Markdown source={item.body} tone="paper" />
      {item.check && <Quiz key={item.id} question={item.check.question} options={item.check.options} answerIndex={item.check.answerIndex} explanation={item.check.explanation} />}
      <div className="flex justify-end">
        {completed ? (
          <span className="inline-flex items-center gap-2 font-mono text-[12px] text-success">
            <Check size={14} strokeWidth={2} aria-hidden="true" />
            Completed
          </span>
        ) : (
          <Button variant="primary" size="md" loading={completing} onClick={() => void complete()}>
            Mark complete
          </Button>
        )}
      </div>
    </article>
  );
}

interface QuizProps {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

function Quiz({ question, options, answerIndex, explanation }: QuizProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = picked === answerIndex;
  return (
    <section aria-label="Check your understanding" className="flex flex-col gap-3 rounded-2xl bg-black/[0.03] p-4">
      <h4 className="font-serif text-[16px] font-semibold text-ink">{question}</h4>
      <div role="group" aria-label="Answers" className="flex flex-col gap-2">
        {options.map((opt, i) => (
          <button
            key={opt}
            type="button"
            aria-pressed={picked === i}
            disabled={answered && picked !== i}
            onClick={() => setPicked(i)}
            className={cn(
              "rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-left text-[14px] text-ink transition-colors hover:border-ink/25 disabled:opacity-60",
              picked === i && "border-accent bg-accent/10",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      {answered && (
        <div role="status" className={cn("flex flex-col gap-1 text-[14px]", correct ? "text-success" : "text-danger")}>
          <span className="inline-flex items-center gap-2 font-medium">
            {correct ? <Check size={15} strokeWidth={2} aria-hidden="true" /> : <X size={15} strokeWidth={2} aria-hidden="true" />}
            {correct ? "Correct." : `Not quite. The answer is "${options[answerIndex]}".`}
          </span>
          <p className="text-ink/80">{explanation}</p>
        </div>
      )}
    </section>
  );
}

interface TutorChatProps {
  progress: StageProgress;
  npc: Npc;
  onChat(message: string): Promise<void>;
  onError(e: unknown): void;
}

function TutorChat({ progress, npc, onChat, onError }: TutorChatProps) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const messages = progress.learnMessages;

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [messages.length, pending]);

  const send = async () => {
    const text = draft.trim();
    if (!text || pending) return;
    setDraft("");
    setPending(text);
    try {
      await onChat(text);
    } catch (e) {
      setDraft(text);
      onError(e);
    } finally {
      setPending(null);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <section aria-label="Tutor" className="paper flex flex-col gap-4 p-6">
      <header className="flex flex-col gap-1">
        <h2 className="font-serif text-[20px] font-medium text-ink">Tutor</h2>
        <p className="text-[12px] text-muted">Asking the tutor a lot lowers your Independence score.</p>
      </header>
      <div className="flex max-h-[320px] flex-col gap-3 overflow-y-auto pr-1" aria-live="polite">
        {messages.length === 0 && <p className="text-[14px] text-muted italic">Stuck on an idea? Ask {npc.name}&apos;s tutor a question.</p>}
        {messages.map((m) =>
          m.role === "system" ? null : <ChatBubble key={m.id} side={m.role === "learner" ? "learner" : "npc"} name={npc.name} avatarSeed={npc.avatarSeed} text={m.text} tone="paper" />,
        )}
        {pending !== null && <ChatBubble side="learner" text={pending} pending tone="paper" />}
        {pending !== null && <TypingIndicator name={npc.name} avatarSeed={npc.avatarSeed} tone="paper" />}
        <div ref={endRef} />
      </div>
      <div className="flex items-end gap-2">
        <Textarea
          aria-label="Ask the tutor"
          placeholder="Ask about this stage…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          disabled={!!pending}
          rows={1}
          maxRows={5}
          className="min-w-0 flex-1 bg-white text-ink placeholder:text-muted/80"
        />
        <Button variant="primary" size="md" disabled={!draft.trim() || !!pending} onClick={() => void send()} icon={<Send size={15} strokeWidth={1.75} aria-hidden="true" />}>
          Ask
        </Button>
      </div>
    </section>
  );
}
