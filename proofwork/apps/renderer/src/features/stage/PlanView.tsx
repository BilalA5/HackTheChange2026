import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, CheckCircle2, Send } from "lucide-react";
import type { Npc, Stage, StageProgress } from "@pw/shared";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Fields";
import { ChatBubble, TypingIndicator } from "./ChatBubble";

export const PLAN_QUICK_REPLIES = ["Sounds good", "Can we cut scope?", "What does done look like?"] as const;

export interface PlanViewProps {
  stage: Stage;
  npc: Npc;
  progress: StageProgress;
  /** Sends a learner message. Resolves once the server has answered and the objective is updated. */
  onSend(message: string): Promise<void>;
  onStartDoing(): Promise<void>;
  onError(e: unknown): void;
  disabled?: boolean;
}

/** Plan mode: chat with the manager until the requirements are agreed. */
export function PlanView({ stage, npc, progress, onSend, onStartDoing, onError, disabled = false }: PlanViewProps) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const complete = progress.planComplete;
  const messages = progress.planMessages;

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [messages.length, pending]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || pending || complete || disabled) return;
    setDraft("");
    setPending(text);
    try {
      await onSend(text);
    } catch (e) {
      setDraft(text);
      onError(e);
    } finally {
      setPending(null);
    }
  };

  const startDoing = async () => {
    setStarting(true);
    try {
      await onStartDoing();
    } catch (e) {
      onError(e);
    } finally {
      setStarting(false);
    }
  };

  const onComposerKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(draft);
    }
  };

  const minutes = progress.estimatedMinutes ?? stage.estMinutes;
  const requirementCount = progress.agreedRequirements.length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {complete && (
        <section
          aria-label="Plan agreed"
          className="glass mx-5 mt-4 flex shrink-0 flex-col gap-3 p-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            <CheckCircle2 size={18} strokeWidth={1.75} className="text-success" aria-hidden="true" />
            <h2 className="text-[15px] font-medium">Plan agreed</h2>
            <span className="font-mono text-[12px] text-fg-muted">
              ~{minutes} min · {requirementCount} requirement{requirementCount === 1 ? "" : "s"}
            </span>
            <Button variant="light" size="md" className="ml-auto" loading={starting} iconRight={<ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />} onClick={() => void startDoing()}>
              Start doing
            </Button>
          </div>
          {requirementCount > 0 && (
            <ul className="flex list-disc flex-col gap-1 pl-5 text-[13px] text-fg/90">
              {progress.agreedRequirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4" aria-live="polite">
        {messages.length === 0 && <ChatBubble side="npc" name={npc.name} avatarSeed={npc.avatarSeed} text={stage.planOpener} />}
        {messages.map((m) =>
          m.role === "system" ? (
            <p key={m.id} className="text-center font-mono text-[11px] tracking-[0.06em] text-fg-muted uppercase">
              {m.text}
            </p>
          ) : (
            <ChatBubble
              key={m.id}
              side={m.role === "learner" ? "learner" : "npc"}
              name={npc.name}
              avatarSeed={npc.avatarSeed}
              text={m.text}
            />
          ),
        )}
        {pending !== null && <ChatBubble side="learner" text={pending} pending />}
        {pending !== null && <TypingIndicator name={npc.name} avatarSeed={npc.avatarSeed} />}
        <div ref={endRef} />
      </div>

      {!complete && (
        <div className="flex shrink-0 flex-col gap-3 border-t border-line px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {PLAN_QUICK_REPLIES.map((q) => (
              <button
                key={q}
                type="button"
                disabled={!!pending || disabled}
                onClick={() => void send(q)}
                className="rounded-full bg-white/8 px-3.5 py-1.5 text-[12.5px] text-fg-muted transition-colors hover:bg-white/14 hover:text-fg disabled:opacity-45"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <Textarea
              aria-label="Message your manager"
              placeholder="Reply to your manager…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onComposerKey}
              disabled={!!pending || disabled}
              rows={1}
              maxRows={6}
              className="min-w-0 flex-1"
            />
            <Button
              variant="primary"
              size="md"
              aria-label="Send message"
              disabled={!draft.trim() || !!pending || disabled}
              onClick={() => void send(draft)}
              icon={<Send size={15} strokeWidth={1.75} aria-hidden="true" />}
            >
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
