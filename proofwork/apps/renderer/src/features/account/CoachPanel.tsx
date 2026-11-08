import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Send, Sparkles } from "lucide-react";
import { CREDIT_COSTS, type ChatMessage } from "@pw/shared";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Fields";
import { Skeleton } from "@/components/ui/Feedback";
import { toast } from "@/components/ui/Toaster";
import { NpcAvatar } from "@/components/domain";
import { ApiError, api, useApi } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useUi, type PanelProps } from "@/stores/ui";
import { ChatBubble, type ChatTeam } from "./ChatBubble";

const TEAM: ChatTeam = { name: "Coach Ada", seed: "coach" };

const SUGGESTIONS = ["What should I focus on this week?", "How do I prepare for interviews?", "Review my progress"] as const;

/** Right-hand sheet with the career coach. Replies are Markdown and each one costs credits. */
export default function CoachPanel({ onClose }: PanelProps) {
  const history = useApi("GET /coach/history", {}, []);
  const health = useApi("GET /health", {}, []);
  const degraded = health.data?.degraded ?? null;
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outOfCredits, setOutOfCredits] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const messages: ChatMessage[] = history.data ?? [];
  const hasLearnerMessage = messages.some((m) => m.role === "learner");

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, sending]);

  const send = async (raw: string) => {
    const body = raw.trim();
    if (!body || sending) return;
    const pendingId = `pending-${Date.now()}`;
    const optimistic: ChatMessage = { id: pendingId, role: "learner", text: body, at: new Date().toISOString() };

    setSending(true);
    setError(null);
    setOutOfCredits(false);
    setText("");
    history.mutate((prev) => [...(prev ?? []), optimistic]);

    try {
      const res = await api("POST /coach/chat", { body: { message: body } });
      history.mutate(res.history);
      health.reload();
    } catch (e) {
      history.mutate((prev) => (prev ?? []).filter((m) => m.id !== pendingId));
      setText((current) => current || body);
      if (e instanceof ApiError && (e.status === 402 || e.code === "insufficient_credits")) {
        setOutOfCredits(true);
        toast({ title: "Not enough credits", body: "Top up to keep talking to your coach.", tone: "warning" });
      } else {
        setError(errorMessage(e));
      }
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(text);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(text);
    }
  };

  return (
    <Sheet open onClose={onClose} title="Career coach" width={420}>
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="flex items-center gap-3">
          <NpcAvatar name={TEAM.name} seed={TEAM.seed} size="sm" />
          <div className="min-w-0">
            <div className="text-[14px] font-medium text-fg">{TEAM.name}</div>
            <div className="text-[12px] text-fg-muted">Each reply uses {CREDIT_COSTS.coach_chat.amount} credits.</div>
          </div>
        </div>

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto pr-1" aria-live="polite">
          {history.loading && !history.data && (
            <div className="flex flex-col gap-3" aria-label="Loading conversation">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="ml-auto h-12 w-2/3" />
            </div>
          )}

          {history.error && !history.data && (
            <div role="alert" className="flex flex-col items-start gap-3 text-[14px] text-danger">
              <span>Could not load your conversation. {history.error.message}</span>
              <Button variant="glass" size="sm" onClick={() => history.reload()}>
                Try again
              </Button>
            </div>
          )}

          {history.data && messages.length === 0 && (
            <div className="flex flex-col items-start gap-2 rounded-card border border-line bg-white/4 p-5">
              <Sparkles size={18} strokeWidth={1.75} className="text-accent" aria-hidden="true" />
              <p className="text-[14px] text-fg">
                Ask about your next step, interview prep, or how your projects are going. Ada uses what she knows about your progress.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} team={TEAM} markdown={m.role === "npc"} />
            ))}
            {sending && <p className="text-[12px] text-fg-muted">Ada is typing...</p>}
          </div>
        </div>

        {degraded && (
          <div role="status" className="rounded-card border border-warning/40 bg-warning/10 p-3 text-[13px] leading-relaxed text-fg">
            <span className="font-medium">Ada is using offline replies.</span> {degraded.message}
          </div>
        )}

        {outOfCredits && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-card border border-warning/40 bg-warning/10 p-3 text-[13px] text-fg">
            <span>You are out of credits. Top up to keep chatting.</span>
            <Button size="sm" variant="light" onClick={() => useUi.getState().openPanel("credits")}>
              Add credits
            </Button>
          </div>
        )}

        {error && (
          <p role="alert" className="text-[13px] text-danger">
            {error}
          </p>
        )}

        {!hasLearnerMessage && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={sending}
                onClick={() => void send(s)}
                className="rounded-full border border-line bg-white/6 px-3 py-1.5 text-[13px] text-fg transition-colors duration-200 hover:bg-white/12 disabled:opacity-45"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex items-end gap-2">
          <Textarea
            aria-label={`Message ${TEAM.name}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask your coach. Enter sends, Shift Enter adds a line."
            rows={2}
            maxRows={6}
            className="min-w-0 flex-1"
            disabled={sending}
          />
          <Button type="submit" size="md" loading={sending} disabled={text.trim().length === 0} icon={<Send size={15} strokeWidth={1.75} />}>
            Send
          </Button>
        </form>
      </div>
    </Sheet>
  );
}
