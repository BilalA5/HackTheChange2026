import { useState } from "react";
import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/cn";
import { usePushToTalk } from "@/hooks/usePushToTalk";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Fields";

export interface PushToTalkButtonProps {
  onFinal(text: string): void;
  vocabulary?: string[];
  enabled?: boolean;
  className?: string;
}

/**
 * Big round mic: "HOLD SPACE TO TALK", a level ring, and the live partial transcript.
 * When speech recognition is unavailable it shows a typed fallback instead.
 */
export function PushToTalkButton({ onFinal, vocabulary, enabled = true, className }: PushToTalkButtonProps) {
  const ptt = usePushToTalk({ enabled, vocabulary, onFinal });
  const [typed, setTyped] = useState("");

  if (!ptt.available) {
    return (
      <form
        className={cn("flex w-full flex-col gap-3", className)}
        onSubmit={(e) => {
          e.preventDefault();
          const text = typed.trim();
          if (!text) return;
          onFinal(text);
          setTyped("");
        }}
      >
        <Textarea
          label="Type your answer"
          hint="Voice input is unavailable here. Press ⌘ Enter to send."
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
          }}
          rows={2}
          maxRows={8}
        />
        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md" disabled={!typed.trim()}>
            Send
          </Button>
        </div>
      </form>
    );
  }

  const listening = ptt.state === "listening";
  const processing = ptt.state === "processing";
  const ring = 1 + ptt.level * 0.45;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative flex size-[88px] items-center justify-center">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-accent/25 transition-transform duration-100"
          style={{ transform: `scale(${listening ? ring : 1})`, opacity: listening ? 0.4 + ptt.level * 0.6 : 0 }}
        />
        <button
          type="button"
          onClick={ptt.toggle}
          disabled={processing}
          aria-pressed={listening}
          aria-label={listening ? "Stop listening" : "Start talking"}
          className={cn(
            "relative inline-flex size-[72px] items-center justify-center rounded-full text-white transition-colors duration-200 disabled:opacity-60",
            listening ? "bg-danger" : "bg-accent hover:bg-accent-hover",
          )}
        >
          {listening ? <Square size={20} strokeWidth={2} fill="currentColor" aria-hidden="true" /> : <Mic size={24} strokeWidth={1.75} aria-hidden="true" />}
        </button>
      </div>
      <p className="font-mono text-[11px] tracking-[0.08em] text-fg-muted uppercase" aria-live="polite">
        {listening ? "Listening…" : processing ? "Processing…" : "Hold Space to talk"}
      </p>
      {ptt.partial && <p className="max-w-[520px] text-center text-[14px] text-fg/80 italic">{ptt.partial}</p>}
    </div>
  );
}
