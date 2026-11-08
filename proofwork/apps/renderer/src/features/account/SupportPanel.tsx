import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Fields";
import { Skeleton } from "@/components/ui/Feedback";
import { NpcAvatar } from "@/components/domain";
import { api, useApi } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { toast } from "@/components/ui/Toaster";
import type { PanelProps } from "@/stores/ui";
import { ChatBubble, type ChatTeam } from "./ChatBubble";

const TEAM: ChatTeam = { name: "Proofwork Support", seed: "support" };

/** Right-hand sheet with the support thread. Replies arrive in the same thread. */
export default function SupportPanel({ onClose }: PanelProps) {
  const thread = useApi("GET /support/thread", {}, []);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const messages = thread.data ?? [];

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError(null);
    try {
      // The endpoint returns the whole thread, so the cache takes it as-is.
      const next = await api("POST /support/thread", { body: { text: body } });
      thread.mutate(next);
      setText("");
    } catch (e) {
      setSendError(errorMessage(e));
      toast({ title: "Message not sent", body: "Your text is still in the box.", tone: "danger" });
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <Sheet open onClose={onClose} title="Support" width={420}>
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="flex items-center gap-3">
          <NpcAvatar name={TEAM.name} seed={TEAM.seed} size="sm" />
          <div className="min-w-0">
            <div className="text-[14px] font-medium text-fg">{TEAM.name}</div>
            <div className="text-[12px] text-fg-muted">Replies appear in this thread.</div>
          </div>
        </div>

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto pr-1" aria-live="polite">
          {thread.loading && !thread.data && (
            <div className="flex flex-col gap-3" aria-label="Loading thread">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="ml-auto h-12 w-2/3" />
            </div>
          )}

          {thread.error && !thread.data && (
            <div role="alert" className="flex flex-col items-start gap-3 text-[14px] text-danger">
              <span>Could not load the thread. {thread.error.message}</span>
              <Button variant="glass" size="sm" onClick={() => thread.reload()}>
                Try again
              </Button>
            </div>
          )}

          {thread.data && messages.length === 0 && (
            <div className="flex flex-col gap-2 rounded-card border border-line bg-white/4 p-5">
              <p className="text-[14px] text-fg">
                Ask about your account, billing, or anything that looks wrong in Proofwork. Describe what you were doing and we will take it from
                there.
              </p>
              <p className="text-[12px] text-fg-muted">For a bug with a screenshot, use the bug reporter (Command Shift B).</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} team={TEAM} markdown={false} />
            ))}
          </div>
        </div>

        {sendError && (
          <p role="alert" className="text-[13px] text-danger">
            {sendError}
          </p>
        )}

        <form onSubmit={onSubmit} className="flex items-end gap-2">
          <Textarea
            aria-label={`Message to ${TEAM.name}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Write a message. Enter sends, Shift Enter adds a line."
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
