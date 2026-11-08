import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ExternalLink, Eye, EyeOff, HelpCircle, Mic, Pointer, Send, Volume2, VolumeX, Play, Square, RotateCcw } from "lucide-react";
import type { Npc } from "@pw/shared";
import { createCoworkClient, captureContext, useCowork, type CoworkClient, type CoworkState } from "@/lib/realtime/cowork";
import { tts } from "@/lib/voice/tts";
import { usePushToTalk } from "@/hooks/usePushToTalk";
import { cn } from "@/lib/cn";
import { Button, IconButton } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Fields";
import { Markdown } from "@/components/ui/Markdown";
import { ChatBubble, TypingIndicator } from "./ChatBubble";

export interface CoworkPanelProps {
  objectiveId: string;
  stageId: string;
  learnerName: string;
  npc: Npc;
  onOpenCredits(): void;
}

type InlineEvent =
  | { kind: "xp"; id: number; afterId: string | null; amount: number; reason: string }
  | { kind: "resource"; id: number; afterId: string | null; title: string; body: string; url?: string };

let inlineSeq = 0;
const nextInlineId = () => {
  inlineSeq += 1;
  return inlineSeq;
};

const REASON_TEXT: Record<string, string> = {
  learner_ended: "You ended the session.",
  budget_exhausted: "This session used up its time budget.",
  insufficient_credits: "You are out of credits. Top up to keep working with your co-worker.",
  error: "The session stopped because of an error.",
};

/**
 * AI co-worker for Do mode. The client is created when a session starts and closed when it is
 * replaced or when this panel unmounts. Parent keys this component by stage.
 */
export function CoworkPanel({ objectiveId, stageId, learnerName, npc, onOpenCredits }: CoworkPanelProps) {
  const [client, setClient] = useState<CoworkClient | null>(null);

  useEffect(() => {
    if (!client) return;
    return () => client.close();
  }, [client]);

  const start = () => {
    const next = createCoworkClient({ objectiveId, stageId, mode: "do", learnerName });
    next.connect();
    setClient(next);
  };

  if (!client) {
    return (
      <section aria-label="AI co-worker" className="glass flex flex-col gap-4 p-5">
        <CoworkHeader connection="closed" credits={null} />
        <p className="text-[14px] text-fg-muted">
          {npc.name} can answer questions while you work, point at things on your screen and track your todos. Start a session to begin.
        </p>
        <div>
          <Button variant="primary" size="md" icon={<Play size={14} strokeWidth={1.75} aria-hidden="true" />} onClick={start}>
            Start session
          </Button>
        </div>
      </section>
    );
  }

  return <CoworkSession client={client} npc={npc} onRestart={start} onOpenCredits={onOpenCredits} />;
}

function CoworkHeader({ connection, credits }: { connection: CoworkState["connection"]; credits: CoworkState["credits"] }) {
  const dot =
    connection === "open"
      ? "bg-success"
      : connection === "connecting"
        ? "bg-warning animate-pulse"
        : connection === "reconnect-exhausted"
          ? "bg-danger"
          : "bg-fg-muted/50";
  const label =
    connection === "open" ? "Connected" : connection === "connecting" ? "Connecting" : connection === "reconnect-exhausted" ? "Offline" : "Not connected";
  const creditText = credits === null ? null : credits.balance === null ? "Unlimited credits" : `${credits.balance.toLocaleString("en-US")} credits left`;
  return (
    <header className="flex flex-wrap items-center gap-3">
      <h2 className="font-serif text-[20px] font-medium">AI co-worker</h2>
      <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.06em] text-fg-muted uppercase" role="status">
        <span aria-hidden="true" className={cn("size-2 rounded-full", dot)} />
        {label}
      </span>
      {creditText && <span className="ml-auto font-mono text-[11px] text-fg-muted">{creditText}</span>}
    </header>
  );
}

interface CoworkSessionProps {
  client: CoworkClient;
  npc: Npc;
  onRestart(): void;
  onOpenCredits(): void;
}

function CoworkSession({ client, npc, onRestart, onOpenCredits }: CoworkSessionProps) {
  const state = useCowork(client);
  const [inline, setInline] = useState<InlineEvent[]>([]);
  const [draft, setDraft] = useState("");
  const [attach, setAttach] = useState(false);
  const [busy, setBusy] = useState(false);
  const [muted, setMuted] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [lostText, setLostText] = useState("");
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const endRef = useRef<HTMLDivElement>(null);
  const ended = state.ended !== null;

  // Speak npc replies (tts respects the voice settings), report playback end, and stop speech on unmount.
  useEffect(() => {
    let alive = true;
    const off = client.on("text_response", (m) => {
      if (mutedRef.current) return;
      let started = false;
      tts.speak(m.text, {
        voice: npc.voice,
        speaker: npc.avatarSeed,
        onStart: () => {
          started = true;
        },
        onEnd: () => {
          if (started && alive) client.audioPlaybackDone();
        },
      });
    });
    return () => {
      alive = false;
      off();
      tts.cancel();
    };
  }, [client, npc.voice]);

  // XP and resources are shown inline, after the message that was current when they arrived.
  useEffect(() => {
    const offXp = client.on("xp", (m) => {
      const afterId = client.getState().messages.at(-1)?.id ?? null;
      setInline((prev) => [...prev, { kind: "xp", id: nextInlineId(), afterId, amount: m.amount, reason: m.reason }]);
    });
    const offRes = client.on("resource", (m) => {
      const afterId = client.getState().messages.at(-1)?.id ?? null;
      setInline((prev) => [...prev, { kind: "resource", id: nextInlineId(), afterId, title: m.title, body: m.body, url: m.url }]);
    });
    return () => {
      offXp();
      offRes();
    };
  }, [client]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [state.messages.length, state.thinking]);

  const sendText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || ended) return;
    setBusy(true);
    try {
      const ctx = attach ? await captureContext() : {};
      client.sendText(trimmed, ctx);
      setDraft("");
    } finally {
      setBusy(false);
    }
  };

  const ptt = usePushToTalk({ enabled: !ended && state.connection === "open", onFinal: (t) => void sendText(t) });

  const sendLost = async () => {
    const question = lostText.trim();
    if (!question || ended) return;
    setBusy(true);
    try {
      const ctx = attach ? await captureContext() : {};
      client.imLost(question, ctx);
      setLostText("");
      setLostOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const showMe = () => {
    if (ended) return;
    client.requestHighlight(draft.trim() || "the next thing I should look at");
    setDraft("");
  };

  const onComposerKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void sendText(draft);
    }
  };

  const toggleMute = () => {
    setMuted((m) => {
      if (!m) tts.cancel();
      return !m;
    });
  };

  const renderInline = (afterId: string | null) =>
    inline
      .filter((i) => i.afterId === afterId)
      .map((i) =>
        i.kind === "xp" ? (
          <div key={i.id} className="flex items-center gap-2 self-center rounded-full bg-xp/12 px-3 py-1 font-mono text-[12px] text-xp">
            +{i.amount} XP · {i.reason}
          </div>
        ) : (
          <article key={i.id} className="rounded-2xl border border-line bg-white/5 p-3.5">
            <h3 className="text-[13px] font-medium">{i.title}</h3>
            <Markdown source={i.body} tone="night" className="mt-1 text-[13px]" />
            {i.url && (
              <a
                href={i.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-accent-hover"
              >
                <ExternalLink size={12} strokeWidth={1.75} aria-hidden="true" />
                Open resource
              </a>
            )}
          </article>
        ),
      );

  const reason = state.ended ? (REASON_TEXT[state.ended.reason] ?? "The session ended.") : null;

  return (
    <section aria-label="AI co-worker" className="glass flex min-h-[380px] flex-col overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-line p-4">
        <div className="flex items-center gap-3">
          <CoworkHeader connection={state.connection} credits={state.credits} />
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {ended ? (
              <Button variant="glass" size="sm" icon={<RotateCcw size={13} strokeWidth={1.75} aria-hidden="true" />} onClick={onRestart}>
                Start again
              </Button>
            ) : (
              <Button variant="glass" size="sm" icon={<Square size={12} strokeWidth={1.75} aria-hidden="true" />} onClick={() => client.end()}>
                End session
              </Button>
            )}
          </div>
        </div>
        {state.lastHighlight && (
          <p className="inline-flex items-center gap-2 self-start rounded-full bg-accent/15 px-3 py-1 text-[12px] text-accent-hover" role="status">
            <Pointer size={12} strokeWidth={1.75} aria-hidden="true" />
            Pointing at: {state.lastHighlight.label}
          </p>
        )}
      </div>

      {state.error && !reason && (
        <p role="alert" className="border-b border-line bg-danger/10 px-4 py-2 text-[13px] text-danger">
          {state.error}
        </p>
      )}

      {reason && (
        <div role="status" className="flex flex-wrap items-center gap-3 border-b border-line bg-white/5 px-4 py-3 text-[13px]">
          <span className="min-w-0 flex-1">
            {reason}
            {state.ended?.summary && <span className="block text-fg-muted">{state.ended.summary}</span>}
          </span>
          {state.ended?.reason === "insufficient_credits" && (
            <Button variant="light" size="sm" onClick={onOpenCredits}>
              Top up credits
            </Button>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
        {renderInline(null)}
        {state.messages.length === 0 && !state.thinking && (
          <p className="text-[13px] text-fg-muted italic">
            {state.connection === "open" ? `Say hello to ${npc.name}, or ask a question.` : "Connecting to your co-worker…"}
          </p>
        )}
        {state.messages.map((m) => (
          <div key={m.id} className="flex flex-col gap-3">
            {m.role === "npc" && m.text === "" && m.streaming ? (
              <TypingIndicator name={npc.name} avatarSeed={npc.avatarSeed} />
            ) : (
              <ChatBubble side={m.role === "learner" ? "learner" : "npc"} name={npc.name} avatarSeed={npc.avatarSeed} text={m.text} />
            )}
            {renderInline(m.id)}
          </div>
        ))}
        {state.thinking && state.messages.at(-1)?.role !== "npc" && <TypingIndicator name={npc.name} avatarSeed={npc.avatarSeed} />}
        {state.thinkingFiller && state.thinking && <p className="text-[12px] text-fg-muted italic">{state.thinkingFiller}</p>}
        <div ref={endRef} />
      </div>

      {lostOpen && !ended && (
        <form
          className="flex items-center gap-2 border-t border-line p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void sendLost();
          }}
        >
          <label htmlFor="cowork-lost" className="sr-only">
            What are you stuck on?
          </label>
          <input
            id="cowork-lost"
            autoFocus
            value={lostText}
            onChange={(e) => setLostText(e.target.value)}
            placeholder="What are you stuck on?"
            className="h-10 min-w-0 flex-1 rounded-full border border-line bg-white/6 px-4 text-[14px] text-fg placeholder:text-fg-muted/70"
          />
          <Button type="submit" variant="primary" size="sm" disabled={!lostText.trim() || busy}>
            Ask
          </Button>
        </form>
      )}

      <div className="flex flex-col gap-2.5 border-t border-line p-3">
        <div className="flex items-end gap-2">
          <Textarea
            aria-label="Message your co-worker"
            placeholder={ended ? "Session ended" : "Ask, or describe what you are doing…"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onComposerKey}
            disabled={ended || busy}
            rows={1}
            maxRows={5}
            className="min-w-0 flex-1"
          />
          {ptt.available && (
            <IconButton
              label={ptt.state === "listening" ? "Stop listening" : "Talk to your co-worker"}
              icon={<Mic size={16} strokeWidth={1.75} />}
              active={ptt.state === "listening"}
              disabled={ended}
              onClick={ptt.toggle}
              className={cn(ptt.state === "listening" && "bg-danger text-white")}
            />
          )}
          <IconButton
            label={attach ? "Stop attaching my screen" : "Attach my screen"}
            icon={attach ? <Eye size={16} strokeWidth={1.75} /> : <EyeOff size={16} strokeWidth={1.75} />}
            active={attach}
            onClick={() => setAttach((a) => !a)}
          />
          <IconButton label={muted ? "Unmute co-worker voice" : "Mute co-worker voice"} icon={muted ? <VolumeX size={16} strokeWidth={1.75} /> : <Volume2 size={16} strokeWidth={1.75} />} active={muted} onClick={toggleMute} />
          <Button variant="primary" size="md" aria-label="Send" disabled={!draft.trim() || ended || busy} loading={busy} onClick={() => void sendText(draft)} icon={<Send size={15} strokeWidth={1.75} aria-hidden="true" />}>
            Send
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="glass" size="sm" disabled={ended} icon={<HelpCircle size={13} strokeWidth={1.75} aria-hidden="true" />} onClick={() => setLostOpen((o) => !o)}>
            I&apos;m lost
          </Button>
          <Button variant="glass" size="sm" disabled={ended} icon={<Pointer size={13} strokeWidth={1.75} aria-hidden="true" />} onClick={showMe}>
            Show me
          </Button>
          {attach && <span className="font-mono text-[11px] text-fg-muted">Screen attached to your next message</span>}
        </div>
      </div>
    </section>
  );
}
