import type { NpcVoice } from "@pw/shared";
import { fetchSpeech } from "@/lib/api";
import { useSession } from "@/stores/session";

/*
 * Text to speech. By default lines are spoken by the server's natural voice model (Gemini TTS, or the local
 * Kokoro model): text is split into sentence-sized clips, each clip is fetched as WAV and played in order, and the
 * next clip is fetched while the current one plays. When the server cannot speak (no engine, offline) or the
 * learner turns natural voices off, the system voice (speechSynthesis) is used instead.
 * Utterances play one at a time from a queue. Settings: voice.ttsEnabled, voice.ttsRate, voice.ttsNatural.
 */

export interface SpeakOptions {
  /** Per-speaker voice: style (natural voices), system voice name preference, rate multiplier and pitch. */
  voice?: Partial<NpcVoice>;
  /** Stable speaker id (an NPC avatar seed) so a character always gets the same natural voice. */
  speaker?: string;
  onStart?: () => void;
  /** System voice only: word boundaries. Natural voices do not report them. */
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
let currentAudio: HTMLAudioElement | null = null;
/** Resolves the clip that is playing when cancel() stops it. */
let stopClip: (() => void) | null = null;
/** After a failed natural-voice request, use the system voice until this time. */
let naturalDownUntil = 0;
const NATURAL_RETRY_MS = 60_000;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function synth(): SpeechSynthesis | null {
  return typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
}

function voiceSettings() {
  return useSession.getState().user?.settings.voice;
}

function rateFor(opts: SpeakOptions): number {
  return clamp((opts.voice?.rate ?? 1) * (voiceSettings()?.ttsRate ?? 1), 0.5, 2);
}

/** True when lines should go to the server's natural voice model. */
export function naturalVoiceWanted(): boolean {
  if (typeof Audio === "undefined") return false;
  if (voiceSettings()?.ttsNatural === false) return false;
  return Date.now() >= naturalDownUntil;
}

// ───────────────────────────── text → clips ─────────────────────────────

/** Longest clip sent to the server (its limit is 600 characters). */
const MAX_CLIP_CHARS = 320;

function splitLong(sentence: string): string[] {
  if (sentence.length <= MAX_CLIP_CHARS) return [sentence];
  const out: string[] = [];
  let rest = sentence;
  while (rest.length > MAX_CLIP_CHARS) {
    const window = rest.slice(0, MAX_CLIP_CHARS);
    const cut = Math.max(window.lastIndexOf(", "), window.lastIndexOf("; "), window.lastIndexOf(" "));
    const at = cut > MAX_CLIP_CHARS / 2 ? cut + 1 : MAX_CLIP_CHARS;
    out.push(rest.slice(0, at).trim());
    rest = rest.slice(at).trim();
  }
  if (rest) out.push(rest);
  return out;
}

/** Size limit per clip position: the second clip stays short so it is ready before the first one finishes. */
const clipLimit = (index: number) => (index <= 1 ? 200 : MAX_CLIP_CHARS);

/**
 * Sentence-sized clips. The first clip is a single sentence so speech starts quickly; later sentences are grouped
 * (the second clip up to 200 characters, the rest up to MAX_CLIP_CHARS) so the voice keeps a natural flow.
 */
export function chunkSpeech(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  // Split only where end punctuation is followed by a space, so "19.5%" and "v2.1" stay whole.
  const sentences = clean.split(/(?<=[.!?…]["')\]]?)\s+/).map((s) => s.trim()).filter(Boolean).flatMap(splitLong);
  const clips: string[] = [];
  for (const s of sentences) {
    const last = clips.length - 1;
    if (clips.length > 1 && clips[last].length + 1 + s.length <= clipLimit(last)) clips[last] = `${clips[last]} ${s}`;
    else clips.push(s);
  }
  return clips;
}

// ───────────────────────────── clip cache ─────────────────────────────

const MAX_CACHED = 80;
const clipCache = new Map<string, Promise<string>>();

function clipKey(text: string, opts: SpeakOptions): string {
  return JSON.stringify([text, opts.voice?.style ?? "", opts.voice?.voiceName ?? "", opts.speaker ?? ""]);
}

/** Object URL of the clip's WAV, fetched once and reused. Failed fetches are not cached. */
function clipUrl(text: string, opts: SpeakOptions): Promise<string> {
  const key = clipKey(text, opts);
  const hit = clipCache.get(key);
  if (hit) {
    clipCache.delete(key);
    clipCache.set(key, hit);
    return hit;
  }
  const pending = fetchSpeech({
    text,
    voice: { style: opts.voice?.style, voiceName: opts.voice?.voiceName },
    speaker: opts.speaker,
  }).then(({ blob }) => URL.createObjectURL(blob));
  clipCache.set(key, pending);
  pending.catch(() => clipCache.delete(key));
  while (clipCache.size > MAX_CACHED) {
    const [oldKey, oldUrl] = clipCache.entries().next().value as [string, Promise<string>];
    clipCache.delete(oldKey);
    void oldUrl.then((u) => {
      if (currentAudio?.src !== u) URL.revokeObjectURL(u);
    }, () => {});
  }
  return pending;
}

/** Fetches the first clips of `text` ahead of time, so speaking it later starts without a wait. */
export function prefetch(text: string, opts: SpeakOptions = {}): void {
  const enabled = voiceSettings()?.ttsEnabled ?? true;
  if (!enabled || !naturalVoiceWanted()) return;
  for (const clip of chunkSpeech(text).slice(0, 2)) void clipUrl(clip, opts).catch(() => {});
}

// ───────────────────────────── playback ─────────────────────────────

function finishItem(item: QueueItem, gen: number): void {
  if (gen !== generation) return;
  current = null;
  currentAudio = null;
  item.opts.onEnd?.();
  playNext();
}

function pickSystemVoice(name?: string): SpeechSynthesisVoice | undefined {
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

/** Speaks `text` with the system voice, then calls done (unless cancelled). */
function playSystem(text: string, opts: SpeakOptions, gen: number, started: boolean, done: () => void): void {
  const s = synth();
  if (!s) {
    done();
    return;
  }
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickSystemVoice(opts.voice?.voiceName);
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? "en-US";
  u.rate = rateFor(opts);
  u.pitch = clamp(opts.voice?.pitch ?? 1, 0, 2);
  u.onstart = () => {
    if (gen === generation && !started) opts.onStart?.();
  };
  u.onboundary = (e) => {
    if (gen === generation) opts.onBoundary?.({ charIndex: e.charIndex, charLength: e.charLength });
  };
  u.onend = done;
  u.onerror = done;
  s.speak(u);
}

type ClipOutcome = "ended" | "cancelled" | "blocked";

function playClip(url: string, opts: SpeakOptions, onPlaying: () => void): Promise<ClipOutcome> {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.preservesPitch = true;
    audio.playbackRate = rateFor(opts);
    currentAudio = audio;
    let settled = false;
    const settle = (outcome: ClipOutcome) => {
      if (settled) return;
      settled = true;
      stopClip = null;
      resolve(outcome);
    };
    stopClip = () => {
      audio.pause();
      settle("cancelled");
    };
    audio.onplaying = onPlaying;
    audio.onended = () => settle("ended");
    audio.onerror = () => settle("ended");
    audio.play().catch((e: unknown) => settle(e instanceof DOMException && e.name === "NotAllowedError" ? "blocked" : "ended"));
  });
}

async function playNatural(item: QueueItem, gen: number): Promise<void> {
  const clips = chunkSpeech(item.text);
  let started = false;
  const markStarted = () => {
    if (!started && gen === generation) {
      started = true;
      item.opts.onStart?.();
    }
  };
  for (let i = 0; i < clips.length; i++) {
    let url: string;
    try {
      url = await clipUrl(clips[i], item.opts);
    } catch {
      if (gen !== generation) return;
      // The server cannot speak right now: say the rest with the system voice and retry natural voices later.
      naturalDownUntil = Date.now() + NATURAL_RETRY_MS;
      playSystem(clips.slice(i).join(" "), item.opts, gen, started, () => finishItem(item, gen));
      return;
    }
    if (gen !== generation) return;
    if (i + 1 < clips.length) void clipUrl(clips[i + 1], item.opts).catch(() => {});
    const outcome = await playClip(url, item.opts, markStarted);
    if (outcome === "cancelled" || gen !== generation) return;
    if (outcome === "blocked") {
      // Autoplay was refused (no user gesture yet). The system voice is not subject to that policy.
      playSystem(clips.slice(i).join(" "), item.opts, gen, started, () => finishItem(item, gen));
      return;
    }
  }
  finishItem(item, gen);
}

function playNext(): void {
  const next = queue.shift();
  if (!next) {
    current = null;
    return;
  }
  current = next;
  const gen = generation;
  if (naturalVoiceWanted()) void playNatural(next, gen);
  else playSystem(next.text, next.opts, gen, false, () => finishItem(next, gen));
}

/** Queues `text` for speech. Calls onEnd immediately when speech is unavailable or disabled in settings. */
export function speak(text: string, opts: SpeakOptions = {}): void {
  const enabled = voiceSettings()?.ttsEnabled ?? true;
  const canSpeak = naturalVoiceWanted() || synth() !== null;
  if (!canSpeak || !enabled || text.trim() === "") {
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
  stopClip?.();
  currentAudio?.pause();
  currentAudio = null;
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

export const tts = { speak, cancel, prefetch, isSpeaking, estimateDurationSec };
