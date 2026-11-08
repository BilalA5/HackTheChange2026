// Natural speech for the renderer. Engines are tried in order (Gemini first when its key works, then the local
// Kokoro model). Every clip is cached on disk by engine, voice and text, so a line is synthesised once.
// An engine that fails with a billing, auth or rate-limit error is skipped for a while instead of retried per line.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { NpcVoice, TtsEngineName } from "@pw/shared";
import { resolveModels } from "../index.ts";
import { GeminiClient } from "../providers/gemini.ts";
import { GeminiTtsEngine, KokoroEngine, type TtsEngine } from "./engines.ts";
import { voiceFor } from "./voices.ts";

export interface SpeakRequest {
  text: string;
  voice?: Partial<Pick<NpcVoice, "style" | "voiceName">>;
  speaker?: string;
}

export interface SpeakResult {
  wav: Buffer;
  engine: TtsEngineName;
  voice: string;
  cached: boolean;
}

export interface TtsService {
  /** Configured engines in order of preference. */
  engines(): TtsEngineName[];
  speak(req: SpeakRequest): Promise<SpeakResult>;
  /** Loads slow engines in the background. */
  warm(): void;
}

export class NoVoiceError extends Error {
  constructor(message = "No voice engine is available.") {
    super(message);
  }
}

const MAX_CACHED_CLIPS = 3000;
/** How long an engine is skipped after a billing/auth/rate-limit failure, and after any other failure. */
const COOLDOWN_HARD_MS = 10 * 60_000;
const COOLDOWN_SOFT_MS = 30_000;

function statusOf(err: unknown): number | undefined {
  const s = (err as { status?: unknown } | null)?.status;
  return typeof s === "number" ? s : undefined;
}

/** Collapses whitespace so the same line always hits the same cache entry. */
export function normaliseSpeech(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function createTtsService(opts: {
  engines: TtsEngine[];
  cacheDir: string;
  log?: (msg: string) => void;
  now?: () => number;
}): TtsService {
  const log = opts.log ?? (() => {});
  const now = opts.now ?? Date.now;
  const skipUntil = new Map<TtsEngineName, number>();
  mkdirSync(opts.cacheDir, { recursive: true });
  pruneCache(opts.cacheDir);

  return {
    engines: () => opts.engines.map((e) => e.name),

    warm() {
      for (const e of opts.engines) e.warm?.();
    },

    async speak(req) {
      const text = normaliseSpeech(req.text);
      if (!text) throw new NoVoiceError("Nothing to say.");
      const speaker = req.speaker?.trim() || req.voice?.voiceName || "narrator";
      let lastError: unknown = null;

      for (const engine of opts.engines) {
        const voice = voiceFor(engine.name, req.voice, speaker);
        const file = join(opts.cacheDir, `${createHash("sha256").update(`${engine.name}|${voice}|${text}`).digest("hex")}.wav`);
        if (existsSync(file)) return { wav: readFileSync(file), engine: engine.name, voice, cached: true };
        if ((skipUntil.get(engine.name) ?? 0) > now()) continue;

        try {
          const wav = await engine.synthesize(text, voice);
          const tmp = `${file}.${process.pid}.tmp`;
          writeFileSync(tmp, wav);
          renameSync(tmp, file);
          skipUntil.delete(engine.name);
          return { wav, engine: engine.name, voice, cached: false };
        } catch (err) {
          lastError = err;
          const status = statusOf(err);
          const hard = status === 401 || status === 402 || status === 403 || status === 429;
          skipUntil.set(engine.name, now() + (hard ? COOLDOWN_HARD_MS : COOLDOWN_SOFT_MS));
          log(`[tts] ${engine.name} failed${status ? ` (${status})` : ""}; trying the next engine`);
        }
      }
      throw new NoVoiceError(lastError ? "Every voice engine failed for this line." : undefined);
    },
  };
}

/** Keeps the newest clips when the cache grows past its limit. */
function pruneCache(dir: string): void {
  try {
    const files = readdirSync(dir).filter((f) => f.endsWith(".wav"));
    if (files.length <= MAX_CACHED_CLIPS) return;
    const byAge = files.map((f) => ({ f, t: statSync(join(dir, f)).mtimeMs })).sort((a, b) => a.t - b.t);
    for (const { f } of byAge.slice(0, files.length - MAX_CACHED_CLIPS)) unlinkSync(join(dir, f));
  } catch {
    // A cache we cannot prune still works.
  }
}

type Env = NodeJS.ProcessEnv;

/**
 * Engines from the environment. PW_TTS_PROVIDER = auto (default) | gemini | kokoro | off.
 * auto uses Gemini when a key is set and the AI provider is not forced offline, then Kokoro.
 */
export function enginesFromEnv(dataDir: string, env: Env = process.env, log: (msg: string) => void = () => {}): TtsEngine[] {
  const choice = (env.PW_TTS_PROVIDER ?? "auto").trim().toLowerCase();
  if (choice === "off") return [];
  const offline = ["practice", "mock", "offline"].includes((env.PW_AI_PROVIDER ?? "").trim().toLowerCase());
  const key = env.GEMINI_API_KEY?.trim();
  const engines: TtsEngine[] = [];
  if ((choice === "auto" && key && !offline) || (choice === "gemini" && key)) {
    const client = new GeminiClient({ apiKey: key, models: resolveModels("gemini", env) });
    engines.push(new GeminiTtsEngine(client, env.PW_GEMINI_TTS_MODEL || "gemini-3.8-flash-tts"));
  }
  if (choice === "auto" || choice === "kokoro") {
    const dtype = (["fp32", "fp16", "q8", "q4"] as const).find((d) => d === env.PW_KOKORO_DTYPE) ?? "fp32";
    engines.push(new KokoroEngine(join(dataDir, "models"), dtype, log));
  }
  return engines;
}
