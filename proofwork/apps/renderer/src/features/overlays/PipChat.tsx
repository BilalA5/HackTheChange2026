import { useEffect, useRef, useState, type FormEvent } from "react";
import { Mic, Send } from "lucide-react";
import { pw } from "@/lib/bridge";
import { cn } from "@/lib/cn";
import { newUuid } from "@/lib/uuid";
import { useSession } from "@/stores/session";
import { usePushToTalk } from "@/hooks/usePushToTalk";
import { captureContext, createCoworkClient, useCowork, type CoworkClient } from "@/lib/realtime/cowork";
import type { StageOverlayPayload } from "@/lib/overlayChannels";
import { deriveIslandStatus, STATUS_LABEL } from "./islandStatus";
import { parseCoworkState, type CoworkStatus } from "./overlayMessages";
import { useOverlayMessage, NO_DRAG_CLASS } from "./overlayHooks";

/*
 * Compact co-worker chat for the pip. Two modes:
 *   - island: the island owns the session. Lines come from "cowork:state"; questions go out as
 *     "cowork:command" (im_lost with a question and no regions).
 *   - own: the island is not running, so the pip opens its own co-worker session.
 */

export interface ChatLine {
  id: string;
  role: "learner" | "npc";
  text: string;
}

type CompanionMode = "checking" | "island" | "own";

/** Asks the main process whether the island is up. A "cowork:state" from the island flips to island mode. */
function useCompanionMode(): CompanionMode {
  const [mode, setMode] = useState<CompanionMode>("checking");
  useEffect(() => {
    let alive = true;
    const decide = (next: CompanionMode) => {
      if (alive) setMode((prev) => (prev === "checking" || next === "island" ? next : prev));
    };
    pw.overlay.isOpen("island").then(
      (open) => decide(open ? "island" : "own"),
      () => decide("own"),
    );
    const off = pw.overlay.onMessage((m) => {
      if (m.channel === "cowork:state") decide("island");
    });
    return () => {
      alive = false;
      off();
    };
  }, []);
  return mode;
}

export interface PipChatProps {
  payload: StageOverlayPayload;
}

export function PipChat({ payload }: PipChatProps) {
  const mode = useCompanionMode();
  if (mode === "checking") return <p className="text-[13px] text-fg-muted">Connecting to your co-worker…</p>;
  if (mode === "island") return <IslandRelayChat />;
  return <OwnSessionChat payload={payload} />;
}

function appendNpcIfNew(lines: ChatLine[], text: string): ChatLine[] {
  const last = lines.at(-1);
  if (last?.role === "npc" && last.text === text) return lines;
  return [...lines, { id: newUuid(), role: "npc", text }];
}

function IslandRelayChat() {
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [status, setStatus] = useState<CoworkStatus>("idle");

  useOverlayMessage("cowork:state", parseCoworkState, (s) => {
    setStatus(s.status);
    if (s.lastText) {
      const text = s.lastText;
      setLines((prev) => appendNpcIfNew(prev, text));
    }
  });

  const send = (text: string) => {
    setLines((prev) => [...prev, { id: newUuid(), role: "learner", text }]);
    pw.overlay.broadcast("cowork:command", { cmd: "im_lost", question: text });
  };

  return <ChatView lines={lines} statusLabel={STATUS_LABEL[status]} onSend={send} />;
}

function OwnSessionChat({ payload }: PipChatProps) {
  const [client, setClient] = useState<CoworkClient | null>(null);
  const hydrated = useSession((s) => s.hydrated);
  const { objectiveId, stageId, mode, learnerName } = payload;

  useEffect(() => {
    if (!hydrated) return;
    const c = createCoworkClient({ objectiveId, stageId, mode, learnerName });
    c.connect();
    setClient(c);
    return () => {
      c.close();
      setClient(null);
    };
  }, [hydrated, objectiveId, stageId, mode, learnerName]);

  if (!client) return <p className="text-[13px] text-fg-muted">Connecting to your co-worker…</p>;
  return <ClientChat client={client} />;
}

function ClientChat({ client }: { client: CoworkClient }) {
  const state = useCowork(client);
  const lines: ChatLine[] = state.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ id: m.id, role: m.role === "learner" ? ("learner" as const) : ("npc" as const), text: m.text }));
  const status = deriveIslandStatus({
    started: true,
    connected: state.connection === "open",
    listening: false,
    thinking: state.thinking,
    speaking: false,
    ended: state.ended !== null,
  });

  const send = (text: string) => {
    void captureContext().then((ctx) => client.sendText(text, ctx));
  };

  return <ChatView lines={lines} statusLabel={STATUS_LABEL[status]} onSend={send} />;
}

interface ChatViewProps {
  lines: ChatLine[];
  statusLabel: string;
  onSend(text: string): void;
}

function ChatView({ lines, statusLabel, onSend }: ChatViewProps) {
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-2" aria-label="Co-worker chat">
      <p className="font-mono text-[10px] tracking-[0.08em] text-fg-muted uppercase" aria-live="polite">
        {statusLabel}
      </p>
      <ol ref={listRef} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {lines.length === 0 && <li className="text-[13px] text-fg-muted">Ask your co-worker anything about this stage.</li>}
        {lines.map((l) => (
          <li
            key={l.id}
            className={cn(
              "max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-snug",
              l.role === "learner" ? "ml-auto bg-accent/85 text-white" : "bg-white/8 text-fg",
            )}
          >
            {l.text}
          </li>
        ))}
      </ol>
      <Composer onSend={onSend} />
    </section>
  );
}

function Composer({ onSend }: { onSend(text: string): void }) {
  const [text, setText] = useState("");
  const ptt = usePushToTalk({ onFinal: (t) => onSend(t) });
  const listening = ptt.state === "listening";

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <label htmlFor="pip-chat-input" className="sr-only">
        Message your co-worker
      </label>
      <input
        id="pip-chat-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask your co-worker…"
        className={cn(
          NO_DRAG_CLASS,
          "h-9 min-w-0 flex-1 rounded-full border border-line bg-white/6 px-3.5 text-[13px] text-fg placeholder:text-fg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        )}
      />
      <button
        type="button"
        onClick={ptt.toggle}
        disabled={!ptt.available}
        aria-pressed={listening}
        aria-label={listening ? "Stop listening" : "Talk to your co-worker"}
        title={ptt.available ? "Hold Space or click to talk" : "Voice input is unavailable"}
        className={cn(
          NO_DRAG_CLASS,
          "flex size-9 shrink-0 items-center justify-center rounded-full text-white transition-colors disabled:opacity-40",
          listening ? "bg-danger" : "bg-accent hover:bg-accent-hover",
        )}
      >
        <Mic size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <button
        type="submit"
        disabled={text.trim() === ""}
        aria-label="Send message"
        className={cn(NO_DRAG_CLASS, "flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-fg hover:bg-white/15 disabled:opacity-40")}
      >
        <Send size={15} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </form>
  );
}

