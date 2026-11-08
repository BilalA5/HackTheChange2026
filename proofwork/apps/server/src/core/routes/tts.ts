// POST /api/tts: natural speech for one line, returned as audio/wav.
import type { FastifyInstance } from "fastify";
import { NoVoiceError } from "../../ai/tts/index.ts";
import { HttpError } from "../errors.ts";
import type { Core } from "../types.ts";
import { asObject, optStr, reqStr } from "../validate.ts";

export const MAX_TTS_CHARS = 600;

export function registerTtsRoutes(api: FastifyInstance, core: Core): void {
  api.post("/tts", async (req, reply) => {
    const o = asObject(req.body);
    const text = reqStr(o, "text", { max: MAX_TTS_CHARS });
    const rawVoice = o.voice && typeof o.voice === "object" && !Array.isArray(o.voice) ? (o.voice as Record<string, unknown>) : {};
    const style = rawVoice.style === "feminine" || rawVoice.style === "masculine" ? rawVoice.style : undefined;
    const voiceName = typeof rawVoice.voiceName === "string" ? rawVoice.voiceName.slice(0, 60) : undefined;
    const speaker = optStr(o, "speaker", { max: 80 });
    try {
      const out = await core.tts.speak({ text, voice: { style, voiceName }, speaker });
      return reply
        .header("content-type", "audio/wav")
        .header("x-tts-engine", out.engine)
        .header("cache-control", "private, max-age=86400")
        .send(out.wav);
    } catch (err) {
      if (err instanceof NoVoiceError) throw new HttpError(503, "unavailable", err.message);
      throw err;
    }
  });
}
