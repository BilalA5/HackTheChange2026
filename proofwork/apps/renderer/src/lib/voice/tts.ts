import type { NpcVoice } from "@pw/shared";
import { useSession } from "@/stores/session";

/*
 * Text to speech through speechSynthesis. Utterances play one at a time from a queue.
 * Respects user settings: voice.ttsEnabled turns speech off, voice.ttsRate scales the rate.
 */

export interface SpeakOptions {
  /** Per-speaker voice: name preference, rate multiplier and pitch. */
  voice?: Partial<NpcVoice>;
  onStart?: () => void;
  onBoundary?: (e: { charIndex: number; charLength?: number }) => void;
  /** Called once per utterance, also when it is cancelled or fails. */
  onEnd?: () => void;
}

interface QueueItem {
  text: string;
  opts: SpeakOptions;
}

const queue: QueueItem[] = [];
let current: QueueItem | null = null;
/** Bumped by cancel() so late callbacks from cancelled utterances are ignored. */
let generation = 0;

function synth(): SpeechSynthesis | null {
  return typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function pickVoice(name?: string): SpeechSynthesisVoice | undefined {
  const voices = synth()?.getVoices() ?? [];
  if (name) {
    const exact = voices.find((v) => v.name === name);
    if (exact) return exact;
    const loose = voices.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
    if (loose) return loose;
  }
  const lang = typeof navigator !== "undefined" ? navigator.language.slice(0, 2) : "en";
  return voices.find((v) => v.lang.startsWith(lang)) ?? voices.find((v) => v.lang.startsWith("en"));
}

function playNext(): void {
  const s = synth();
  const next = queue.shift();
  if (!s || !next) {
    current = null;
    return;
  }
  current = next;
  const gen = generation;
  const settings = useSession.getState().user?.settings.voice;
  const u = new SpeechSynthesisUtterance(next.text);
  const voice = pickVoice(next.opts.voice?.voiceName);
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? "en-US";
  u.rate = clamp((next.opts.voice?.rate ?? 1) * (settings?.ttsRate ?? 1), 0.5, 2);
  u.pitch = clamp(next.opts.voice?.pitch ?? 1, 0, 2);
  u.onstart = () => {
    if (gen === generation) next.opts.onStart?.();
  };
  u.onboundary = (e) => {
    if (gen === generation) next.opts.onBoundary?.({ charIndex: e.charIndex, charLength: e.charLength });
  };
  const finish = () => {
    if (gen !== generation) return;
    current = null;
    next.opts.onEnd?.();
    playNext();
  };
  u.onend = finish;
  u.onerror = finish;
  s.speak(u);
}

/** Queues `text` for speech. Calls onEnd immediately when speech is unavailable or disabled in settings. */
export function speak(text: string, opts: SpeakOptions = {}): void {
  const enabled = useSession.getState().user?.settings.voice.ttsEnabled ?? true;
  if (!synth() || !enabled || text.trim() === "") {
    opts.onEnd?.();
    return;
  }
  queue.push({ text, opts });
  if (!current) playNext();
}

/** Stops the current utterance and drops the queue. onEnd fires for each dropped item. */
export function cancel(): void {
  generation += 1;
  const dropped = current ? [current, ...queue] : [...queue];
  queue.length = 0;
  current = null;
  synth()?.cancel();
  for (const item of dropped) item.opts.onEnd?.();
}

export function isSpeaking(): boolean {
  return current !== null || (synth()?.speaking ?? false);
}

/** Rough spoken duration: about 150 words per minute, scaled by rate. */
export function estimateDurationSec(text: string, rate = 1): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 2.5 / Math.max(0.5, rate)));
}

export const tts = { speak, cancel, isSpeaking, estimateDurationSec };
