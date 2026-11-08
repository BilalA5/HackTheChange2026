// Thin wrapper over the Anthropic SDK. Owns model selection, structured JSON output, refusals and
// streaming with tools. Never sends temperature/top_p/top_k, thinking config or assistant prefill.
import Anthropic from "@anthropic-ai/sdk";
import type { ModelTier } from "../contracts.ts";

export interface Models {
  quality: string;
  fast: string;
}

export type JsonSchema = Record<string, unknown>;
export type Content = string | ContentBlock[];
export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: "image/jpeg" | "image/png"; data: string } };

export interface ToolDef {
  name: string;
  description: string;
  input_schema: { type: "object"; properties: Record<string, unknown>; required?: string[]; additionalProperties?: boolean };
  eager_input_streaming: true;
}

export interface ToolUse {
  name: string;
  input: unknown;
}

const FALLBACK_BETA = "server-side-fallback-2026-07-01";

interface RawResponse {
  stop_reason: string | null;
  content: { type: string; text?: string; name?: string; input?: unknown }[];
}

interface StreamLike extends AsyncIterable<{ type: string; delta?: { type: string; text?: string } }> {
  finalMessage(): Promise<RawResponse>;
}

/** Short, log-safe description of an error: status and message only. */
export function describeError(err: unknown): string {
  if (err instanceof Anthropic.APIError) return `status ${err.status ?? "n/a"}: ${err.message}`;
  if (err instanceof Error) return err.message;
  return String(err);
}

export class Llm {
  readonly client: Anthropic;

  constructor(readonly models: Models) {
    this.client = new Anthropic();
  }

  modelFor(tier: ModelTier): string {
    return tier === "quality" ? this.models.quality : this.models.fast;
  }

  /**
   * One request. Quality tier goes through the beta client with the server-side refusal fallback;
   * fast tier uses the plain Messages API.
   */
  async complete(opts: {
    tier: ModelTier;
    system: string;
    content: Content;
    maxTokens?: number;
    schema?: JsonSchema;
  }): Promise<string> {
    const output_config = opts.schema
      ? { effort: "low" as const, format: { type: "json_schema" as const, schema: opts.schema } }
      : { effort: "low" as const };
    const args = {
      model: this.modelFor(opts.tier),
      max_tokens: opts.maxTokens ?? 2000,
      system: opts.system,
      messages: [{ role: "user" as const, content: opts.content }],
      output_config,
    };
    const res = (
      opts.tier === "quality"
        ? await this.client.beta.messages.create({ betas: [FALLBACK_BETA], fallbacks: "default", ...args })
        : await this.client.messages.create(args)
    ) as unknown as RawResponse;

    if (res.stop_reason === "refusal") throw new Error("model refusal");
    const block = res.content.find((b) => b.type === "text");
    if (!block || typeof block.text !== "string") throw new Error("no text block in response");
    return block.text;
  }

  /** Structured JSON: the model is constrained to `schema`; the caller validates the parsed shape. */
  async json<T>(opts: {
    tier: ModelTier;
    system: string;
    content: Content;
    schema: JsonSchema;
    maxTokens?: number;
    validate: (value: unknown) => T;
  }): Promise<T> {
    const text = await this.complete(opts);
    return opts.validate(JSON.parse(text));
  }

  /**
   * Streams text through onDelta and returns the tool_use blocks of the final message.
   * One-shot: tool results are never sent back.
   */
  async stream(opts: {
    tier: ModelTier;
    system: string;
    messages: { role: "user" | "assistant"; content: Content }[];
    tools: ToolDef[];
    maxTokens?: number;
    onDelta: (delta: string) => void;
  }): Promise<{ text: string; toolUses: ToolUse[] }> {
    const args = {
      model: this.modelFor(opts.tier),
      max_tokens: opts.maxTokens ?? 2000,
      system: opts.system,
      messages: opts.messages,
      tools: opts.tools,
      tool_choice: { type: "auto" as const },
      output_config: { effort: "low" as const },
    };
    const stream = (
      opts.tier === "quality"
        ? this.client.beta.messages.stream({ betas: [FALLBACK_BETA], fallbacks: "default", ...args })
        : this.client.messages.stream(args)
    ) as unknown as StreamLike;

    for await (const ev of stream) {
      if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta" && typeof ev.delta.text === "string") {
        opts.onDelta(ev.delta.text);
      }
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") throw new Error("model refusal");
    const text = final.content
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");
    const toolUses = final.content
      .filter((b) => b.type === "tool_use" && typeof b.name === "string")
      .map((b) => ({ name: b.name as string, input: b.input }));
    return { text, toolUses };
  }
}

/** Parse a data URL into a base64 image block, or null when it is not a jpeg/png data URL. */
export function imageBlock(dataUrl: string | undefined): ContentBlock | null {
  if (!dataUrl) return null;
  const m = dataUrl.match(/^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return null;
  return { type: "image", source: { type: "base64", media_type: m[1] as "image/jpeg" | "image/png", data: m[2] } };
}
