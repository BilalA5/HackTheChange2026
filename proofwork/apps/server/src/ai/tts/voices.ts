// Which natural voice a speaker gets. A speaker keeps one voice everywhere: the choice depends only on the
// voice style (feminine/masculine) and a stable speaker id, never on the text.
import type { NpcVoice, TtsEngineName } from "@pw/shared";

type Style = NonNullable<NpcVoice["style"]>;

/** Kokoro voices with the best quality grades in the model card, per style. */
export const KOKORO_VOICES: Record<Style, readonly string[]> = {
  feminine: ["af_heart", "af_bella", "af_nicole", "bf_emma", "af_sarah"],
  masculine: ["am_fenrir", "am_michael", "am_puck", "bm_george", "bm_fable"],
};

/** Gemini prebuilt voices, per style. */
export const GEMINI_VOICES: Record<Style, readonly string[]> = {
  feminine: ["Kore", "Aoede", "Leda", "Despina", "Callirrhoe"],
  masculine: ["Charon", "Puck", "Orus", "Fenrir", "Iapetus"],
};

/** System voice names the authored content uses, mapped to a style when no style is set. */
const STYLE_OF_SYSTEM_NAME: Record<string, Style> = {
  samantha: "feminine",
  karen: "feminine",
  moira: "feminine",
  tessa: "feminine",
  victoria: "feminine",
  daniel: "masculine",
  alex: "masculine",
  fred: "masculine",
  rishi: "masculine",
  tom: "masculine",
};

/** FNV-1a, so the same speaker id maps to the same voice on every run. */
export function hashOf(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function styleFor(voice: Partial<Pick<NpcVoice, "style" | "voiceName">> | undefined, speaker: string): Style {
  if (voice?.style === "feminine" || voice?.style === "masculine") return voice.style;
  const named = voice?.voiceName ? STYLE_OF_SYSTEM_NAME[voice.voiceName.toLowerCase().split(" ")[0]] : undefined;
  if (named) return named;
  return hashOf(`style:${speaker}`) % 2 === 0 ? "feminine" : "masculine";
}

/** The engine-specific voice id for a speaker. */
export function voiceFor(engine: TtsEngineName, voice: Partial<Pick<NpcVoice, "style" | "voiceName">> | undefined, speaker: string): string {
  const style = styleFor(voice, speaker);
  const pool = engine === "gemini" ? GEMINI_VOICES[style] : KOKORO_VOICES[style];
  return pool[hashOf(`voice:${speaker}`) % pool.length];
}
