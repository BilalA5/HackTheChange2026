import { useEffect, useRef, useState } from "react";
import { errorMessage } from "@/lib/errors";
import { startSttTurn, type SttTurn } from "@/lib/voice/stt";

/** Each recognition turn lasts about this long, then is flushed and restarted. */
export const TURN_WINDOW_MS = 30_000;

export interface LiveTranscriptOptions {
  /** Recognition runs while true (recording and not paused). */
  active: boolean;
  /** False when on-device speech is unavailable. Nothing runs then. */
  enabled: boolean;
  micId?: string;
  vocabulary?: string[];
  /** Receives each FINAL text, once per turn. */
  onFinal(text: string): void;
}

export interface LiveTranscript {
  /** Live partial caption for the turn in progress. */
  partial: string;
  error: string | null;
}

/**
 * Streams the microphone into on-device speech recognition. Turns are rotated every 30 s so finals arrive
 * steadily, and each turn is flushed when recording pauses or stops.
 */
export function useLiveTranscript(opts: LiveTranscriptOptions): LiveTranscript {
  const { active, enabled, micId } = opts;
  const [partial, setPartial] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onFinalRef = useRef(opts.onFinal);
  const vocabRef = useRef(opts.vocabulary);
  useEffect(() => {
    onFinalRef.current = opts.onFinal;
    vocabRef.current = opts.vocabulary;
  });

  useEffect(() => {
    if (!enabled || !active) {
      setPartial("");
      return;
    }

    let cancelled = false;
    let turn: SttTurn | null = null;
    let queue: Promise<void> = Promise.resolve();
    const enqueue = (job: () => Promise<void>) => {
      queue = queue.then(job).catch((e: unknown) => {
        if (!cancelled) setError(errorMessage(e));
      });
    };

    const open = async (): Promise<void> => {
      if (cancelled) return;
      const started = await startSttTurn({
        deviceId: micId,
        vocabulary: vocabRef.current,
        onPartial: (text) => {
          if (!cancelled) setPartial(text);
        },
        onFinal: (text) => {
          setPartial("");
          const clean = text.trim();
          if (clean) onFinalRef.current(clean);
        },
        onError: (message) => {
          if (!cancelled) setError(message);
        },
      });
      if (cancelled) {
        await started.stop();
        return;
      }
      turn = started;
    };

    const close = async (): Promise<void> => {
      const current = turn;
      turn = null;
      setPartial("");
      if (current) await current.stop();
    };

    enqueue(open);
    const timer = setInterval(() => enqueue(async () => {
      await close();
      await open();
    }), TURN_WINDOW_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
      enqueue(close);
    };
  }, [active, enabled, micId]);

  return { partial, error };
}
