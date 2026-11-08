import { useCallback, useEffect, useRef, useState } from "react";
import { probeStt, startSttTurn, type SttTurn } from "@/lib/voice/stt";

export type PushToTalkState = "idle" | "listening" | "processing" | "unavailable";

export interface UsePushToTalkOptions {
  /** Default true. When false, the Space shortcut is ignored. */
  enabled?: boolean;
  vocabulary?: string[];
  /** Called with the final, trimmed transcript of each turn (never with an empty string). */
  onFinal(text: string): void;
}

export interface PushToTalk {
  state: PushToTalkState;
  /** Live partial transcript while listening. */
  partial: string;
  /** Smoothed mic level 0..1. */
  level: number;
  /** False in the web build or when the helper is unavailable. Show the typed fallback then. */
  available: boolean;
  start(): Promise<void>;
  stop(): Promise<void>;
  toggle(): void;
}

const FINAL_TIMEOUT_MS = 4000;

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  return t.isContentEditable || t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT";
}

/**
 * Push to talk. Hold Space (when focus is not in a text field) or call toggle() from a mic button.
 * Streams mic PCM to pw.stt when the helper is available, otherwise reports "unavailable".
 */
export function usePushToTalk(opts: UsePushToTalkOptions): PushToTalk {
  const enabled = opts.enabled ?? true;
  const [state, setState] = useState<PushToTalkState>("idle");
  const [partial, setPartial] = useState("");
  const [level, setLevel] = useState(0);
  const [available, setAvailable] = useState(false);

  const onFinalRef = useRef(opts.onFinal);
  onFinalRef.current = opts.onFinal;
  const vocabRef = useRef(opts.vocabulary);
  vocabRef.current = opts.vocabulary;
  const availableRef = useRef(false);
  const turnRef = useRef<SttTurn | null>(null);
  const startingRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    void probeStt().then((s) => {
      if (!alive) return;
      availableRef.current = s.available;
      setAvailable(s.available);
      if (!s.available) setState("unavailable");
    });
    return () => {
      alive = false;
    };
  }, []);

  const finish = useCallback((text: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    turnRef.current = null;
    setLevel(0);
    setPartial("");
    setState(availableRef.current ? "idle" : "unavailable");
    const trimmed = text.trim();
    if (trimmed) onFinalRef.current(trimmed);
  }, []);

  const start = useCallback(async () => {
    if (!availableRef.current || turnRef.current || startingRef.current) return;
    startingRef.current = true;
    stopRequestedRef.current = false;
    setState("listening");
    setPartial("");
    try {
      const turn = await startSttTurn({
        vocabulary: vocabRef.current,
        onPartial: setPartial,
        onLevel: setLevel,
        onFinal: (text) => finish(text),
        onError: () => finish(""),
      });
      turnRef.current = turn;
      if (stopRequestedRef.current) {
        await stop();
      }
    } catch {
      finish("");
    } finally {
      startingRef.current = false;
    }
    // stop is referenced before its declaration only through the ref above; both are stable callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finish]);

  const stop = useCallback(async () => {
    const turn = turnRef.current;
    if (!turn) {
      // Key released before the turn started: stop as soon as it starts.
      if (startingRef.current) stopRequestedRef.current = true;
      return;
    }
    setState("processing");
    timeoutRef.current = setTimeout(() => finish(""), FINAL_TIMEOUT_MS);
    try {
      await turn.stop();
    } catch {
      finish("");
    }
  }, [finish]);

  const toggle = useCallback(() => {
    if (turnRef.current || startingRef.current) void stop();
    else void start();
  }, [start, stop]);

  useEffect(() => {
    if (!enabled) return;
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || isTypingTarget(e.target)) return;
      e.preventDefault();
      void start();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (!turnRef.current && !startingRef.current) return;
      e.preventDefault();
      void stop();
    };
    const blur = () => {
      if (turnRef.current || startingRef.current) void stop();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [enabled, start, stop]);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  return { state, partial, level, available, start, stop, toggle };
}
