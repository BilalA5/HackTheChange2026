// Natural voice engines. Each turns text plus a voice id into a WAV file.
//   gemini: Gemini TTS over the API (needs GEMINI_API_KEY with credits).
//   kokoro: Kokoro-82M, an open-weight neural TTS model run locally on the CPU with onnxruntime. Free and offline
//           after a one-time model download into the server's data folder.
import type { TtsEngineName } from "@pw/shared";
import { GeminiClient } from "../providers/gemini.ts";

export interface TtsEngine {
  readonly name: TtsEngineName;
  synthesize(text: string, voiceId: string): Promise<Buffer>;
  /** Starts any slow setup (model load) ahead of the first request. Never throws. */
  warm?(): void;
}

/** Wraps 16-bit little-endian mono PCM in a WAV header. */
export function pcm16ToWav(pcm: Buffer, sampleRate: number): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36, "ascii");
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export class GeminiTtsEngine implements TtsEngine {
  readonly name = "gemini" as const;
  constructor(
    private readonly client: Pick<GeminiClient, "speech">,
    private readonly model: string,
  ) {}

  async synthesize(text: string, voiceId: string): Promise<Buffer> {
    const { pcm, sampleRate } = await this.client.speech({ model: this.model, text, voiceName: voiceId });
    return pcm16ToWav(pcm, sampleRate);
  }
}

const KOKORO_MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";

type KokoroModel = { generate(text: string, opts: { voice: string }): Promise<{ toWav(): ArrayBuffer }> };

export class KokoroEngine implements TtsEngine {
  readonly name = "kokoro" as const;
  private model: Promise<KokoroModel> | null = null;
  /** One generation at a time: parallel runs only fight over the same CPU cores. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly cacheDir: string,
    private readonly dtype: "fp32" | "fp16" | "q8" | "q4" = "fp32",
    private readonly log: (msg: string) => void = () => {},
  ) {}

  private load(): Promise<KokoroModel> {
    if (!this.model) {
      this.model = (async () => {
        const started = Date.now();
        // Imported on first use so the server starts fast and tests never load onnxruntime.
        const { env } = await import("@huggingface/transformers");
        env.cacheDir = this.cacheDir;
        const { KokoroTTS } = await import("kokoro-js");
        const model = await KokoroTTS.from_pretrained(KOKORO_MODEL, { dtype: this.dtype, device: "cpu" });
        this.log(`[tts] kokoro ${this.dtype} ready in ${Date.now() - started} ms`);
        return model as unknown as KokoroModel;
      })();
      // A failed load (no network on first run) is retried on the next request.
      this.model.catch(() => {
        this.model = null;
      });
    }
    return this.model;
  }

  warm(): void {
    this.load().catch((err: unknown) => this.log(`[tts] kokoro could not load: ${err instanceof Error ? err.message : String(err)}`));
  }

  synthesize(text: string, voiceId: string): Promise<Buffer> {
    const run = this.queue.then(async () => {
      const model = await this.load();
      const audio = await model.generate(text, { voice: voiceId });
      return Buffer.from(audio.toWav());
    });
    this.queue = run.catch(() => undefined);
    return run;
  }
}
