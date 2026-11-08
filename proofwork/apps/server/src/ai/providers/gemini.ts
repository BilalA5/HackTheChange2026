// Google Gemini client over the REST API (global fetch, no SDK).
// - Auth is the x-goog-api-key header, never a query parameter.
// - One retry with back-off on 429/500/503. Every error is scrubbed of the key before it is thrown.
// - Refusals (SAFETY, PROHIBITED_CONTENT, ...) throw "model refusal", the same as the Anthropic client.
import {
  parseJsonText,
  type ChatTurn,
  type CompleteOpts,
  type ContentBlock,
  type JsonOpts,
  type JsonSchema,
  type LlmClient,
  type Models,
  type StreamOpts,
  type StreamResult,
  type ToolUse,
} from "../llm.ts";

export const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_TIMEOUT_MS = 90_000;
const RETRY_DELAY_MS = 1_000;
const RETRY_STATUS = new Set([429, 500, 503]);
const MIN_OUTPUT_TOKENS = 4096;
const REFUSAL_REASONS = new Set(["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII", "IMAGE_SAFETY", "RECITATION"]);

export interface GeminiClientOptions {
  apiKey: string;
  models: Models;
  baseUrl?: string;
  /** Injected in tests. Defaults to the global fetch, looked up at call time. */
  fetch?: typeof fetch;
  retryDelayMs?: number;
}

interface GeminiPart {
  text?: string;
  thought?: boolean;
  functionCall?: { name?: string; args?: unknown };
}

interface GeminiCandidate {
  content?: { parts?: GeminiPart[] };
  finishReason?: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
}

interface GeminiContent {
  role: "user" | "model";
  parts: Record<string, unknown>[];
}

/** Gemini's schema dialect rejects keys we never need. Strip them recursively. */
export function geminiSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(geminiSchema);
  if (!schema || typeof schema !== "object") return schema;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(schema as Record<string, unknown>)) {
    if (k === "additionalProperties" || k === "$schema") continue;
    out[k] = geminiSchema(v);
  }
  return out;
}

function toParts(content: string | ContentBlock[]): Record<string, unknown>[] {
  if (typeof content === "string") return [{ text: content.length ? content : " " }];
  const parts = content.map((b): Record<string, unknown> =>
    b.type === "text" ? { text: b.text } : { inlineData: { mimeType: b.source.media_type, data: b.source.data } },
  );
  return parts.length ? parts : [{ text: " " }];
}

function toContents(messages: ChatTurn[]): GeminiContent[] {
  return messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: toParts(m.content) }));
}

function textOf(parts: GeminiPart[]): string {
  return parts
    .filter((p) => typeof p.text === "string" && p.thought !== true)
    .map((p) => p.text as string)
    .join("");
}

/** Throws on refusals and on responses with no candidate. */
function assertNotRefused(res: GeminiResponse): GeminiCandidate {
  const reason = res.promptFeedback?.blockReason;
  if (reason) throw new Error(`model refusal (prompt blocked: ${reason})`);
  const cand = res.candidates?.[0];
  if (!cand) throw new Error("Gemini returned no candidates");
  if (cand.finishReason && REFUSAL_REASONS.has(cand.finishReason)) throw new Error(`model refusal (${cand.finishReason})`);
  return cand;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class GeminiClient implements LlmClient {
  readonly provider = "gemini" as const;
  readonly models: Models;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch | undefined;
  private readonly retryDelayMs: number;

  constructor(opts: GeminiClientOptions) {
    if (!opts.apiKey) throw new Error("GeminiClient needs an API key");
    this.apiKey = opts.apiKey;
    this.models = opts.models;
    this.baseUrl = opts.baseUrl ?? GEMINI_BASE_URL;
    this.fetchFn = opts.fetch;
    this.retryDelayMs = opts.retryDelayMs ?? RETRY_DELAY_MS;
  }

  modelFor(tier: "quality" | "fast"): string {
    return tier === "quality" ? this.models.quality : this.models.fast;
  }

  /** Removes the key and anything that looks like one from text that may reach logs or callers. */
  private scrub(text: string): string {
    let out = text;
    if (this.apiKey) out = out.split(this.apiKey).join("[key]");
    return out.replace(/AIza[0-9A-Za-z_-]{20,}/g, "[key]");
  }

  private fetchImpl(url: string, init: RequestInit): Promise<Response> {
    return (this.fetchFn ?? globalThis.fetch)(url, init);
  }

  /** One POST with a single retry on 429/500/503. Returns the OK response or throws a scrubbed error. */
  private async post(
    model: string,
    action: "generateContent" | "streamGenerateContent",
    body: unknown,
    timeoutMs: number,
    sse: boolean,
  ): Promise<Response> {
    const url = `${this.baseUrl}/${encodeURIComponent(model)}:${action}${sse ? "?alt=sse" : ""}`;
    for (let attempt = 0; ; attempt++) {
      let res: Response;
      try {
        res = await this.fetchImpl(url, {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": this.apiKey },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(this.scrub(`Gemini request failed: ${msg}`));
      }
      if (res.ok) return res;
      if (RETRY_STATUS.has(res.status) && attempt === 0) {
        await sleep(this.retryDelayMs);
        continue;
      }
      throw await this.apiError(res);
    }
  }

  private async apiError(res: Response): Promise<Error> {
    let message = res.statusText || "request failed";
    try {
      const parsed = JSON.parse(await res.text()) as { error?: { message?: unknown } };
      if (typeof parsed?.error?.message === "string") message = parsed.error.message;
    } catch {
      // Non-JSON error body: keep the status text.
    }
    const err = new Error(this.scrub(`Gemini API error ${res.status}: ${message}`));
    (err as Error & { status?: number }).status = res.status;
    return err;
  }

  private body(args: {
    system: string;
    messages: ChatTurn[];
    maxTokens?: number;
    schema?: JsonSchema;
    tools?: unknown[];
    thinking?: "low";
  }): Record<string, unknown> {
    // Reasoning tokens count against maxOutputTokens, so small caps can return an empty reply. Keep a floor.
    const generationConfig: Record<string, unknown> = { maxOutputTokens: Math.max(args.maxTokens ?? 2000, MIN_OUTPUT_TOKENS) };
    if (args.thinking) generationConfig.thinkingConfig = { thinkingLevel: args.thinking };
    if (args.schema) {
      generationConfig.responseMimeType = "application/json";
      generationConfig.responseJsonSchema = geminiSchema(args.schema);
    }
    const body: Record<string, unknown> = {
      systemInstruction: { parts: [{ text: args.system }] },
      contents: toContents(args.messages),
      generationConfig,
    };
    if (args.tools?.length) body.tools = args.tools;
    return body;
  }

  async complete(opts: CompleteOpts): Promise<string> {
    const body = this.body({
      system: opts.system,
      messages: [{ role: "user", content: opts.content }],
      maxTokens: opts.maxTokens,
      schema: opts.schema,
      thinking: opts.thinking,
    });
    const res = await this.post(this.modelFor(opts.tier), "generateContent", body, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS, false);
    const data = (await res.json()) as GeminiResponse;
    const cand = assertNotRefused(data);
    const text = textOf(cand.content?.parts ?? []);
    if (!text.trim()) throw new Error(`Gemini returned no text (finishReason ${cand.finishReason ?? "unknown"})`);
    return text;
  }

  /**
   * Text to speech with a Gemini TTS model. Returns raw 16-bit little-endian mono PCM and its sample rate
   * (Gemini answers audio/L16 at 24 kHz). Errors are scrubbed like every other call.
   */
  async speech(opts: { model: string; text: string; voiceName: string; timeoutMs?: number }): Promise<{ pcm: Buffer; sampleRate: number }> {
    const body = {
      contents: [{ role: "user", parts: [{ text: opts.text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: opts.voiceName } } },
      },
    };
    const res = await this.post(opts.model, "generateContent", body, opts.timeoutMs ?? 60_000, false);
    const data = (await res.json()) as { candidates?: { content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] } }[] };
    const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!part?.inlineData?.data) throw new Error("Gemini TTS returned no audio");
    const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType ?? "")?.[1] ?? 24000);
    return { pcm: Buffer.from(part.inlineData.data, "base64"), sampleRate: rate };
  }

  async json<T>(opts: JsonOpts<T>): Promise<T> {
    const text = await this.complete(opts);
    return opts.validate(parseJsonText(text));
  }

  async stream(opts: StreamOpts): Promise<StreamResult> {
    const tools = opts.tools.length
      ? [{ functionDeclarations: opts.tools.map((t) => ({ name: t.name, description: t.description, parameters: geminiSchema(t.parameters) })) }]
      : undefined;
    const body = this.body({ system: opts.system, messages: opts.messages, maxTokens: opts.maxTokens, tools });
    const res = await this.post(this.modelFor(opts.tier), "streamGenerateContent", body, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS, true);
    if (!res.body) throw new Error("Gemini stream had no body");

    let text = "";
    const toolUses: ToolUse[] = [];
    let finish: string | undefined;
    let blocked: string | undefined;

    const handle = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) return;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") return;
      let ev: GeminiResponse;
      try {
        ev = JSON.parse(payload) as GeminiResponse;
      } catch {
        throw new Error("Gemini stream sent an unreadable event");
      }
      if (ev.promptFeedback?.blockReason) blocked = ev.promptFeedback.blockReason;
      const cand = ev.candidates?.[0];
      if (cand?.finishReason) finish = cand.finishReason;
      for (const part of cand?.content?.parts ?? []) {
        if (part.functionCall?.name) {
          toolUses.push({ name: part.functionCall.name, input: part.functionCall.args ?? {} });
        } else if (typeof part.text === "string" && part.text && part.thought !== true) {
          text += part.text;
          opts.onDelta(part.text);
        }
      }
    };

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl = buf.indexOf("\n");
      while (nl >= 0) {
        handle(buf.slice(0, nl));
        buf = buf.slice(nl + 1);
        nl = buf.indexOf("\n");
      }
    }
    buf += decoder.decode();
    if (buf.trim()) handle(buf);

    if (blocked) throw new Error(`model refusal (prompt blocked: ${blocked})`);
    if (finish && REFUSAL_REASONS.has(finish)) throw new Error(`model refusal (${finish})`);
    return { text, toolUses };
  }
}
