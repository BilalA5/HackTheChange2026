// Anthropic client. Owns model calls over the Anthropic SDK: structured JSON output, refusals and streaming
// with tools. Quality tier uses the beta client with the server-side refusal fallback; fast tier uses the
// plain Messages API. Never sends temperature/top_p/top_k, thinking config or assistant prefill.
import Anthropic from "@anthropic-ai/sdk";
import {
  parseJsonText,
  type CompleteOpts,
  type JsonOpts,
  type LlmClient,
  type ModelTier,
  type Models,
  type StreamOpts,
  type StreamResult,
  type ToolDef,
  type ToolUse,
} from "../llm.ts";

const FALLBACK_BETA = "server-side-fallback-2026-07-01";

interface RawResponse {
  stop_reason: string | null;
  content: { type: string; text?: string; name?: string; input?: unknown }[];
}

interface StreamLike extends AsyncIterable<{ type: string; delta?: { type: string; text?: string } }> {
  finalMessage(): Promise<RawResponse>;
}

interface AnthropicTool {
  name: string;
  description: string;
  input_schema: { type: "object"; properties: Record<string, unknown>; required?: string[]; additionalProperties?: boolean };
  eager_input_streaming: true;
}

function toTool(t: ToolDef): AnthropicTool {
  return { name: t.name, description: t.description, input_schema: t.parameters as AnthropicTool["input_schema"], eager_input_streaming: true };
}

export class AnthropicClient implements LlmClient {
  readonly provider = "anthropic" as const;
  readonly client: Anthropic;

  constructor(readonly models: Models) {
    this.client = new Anthropic();
  }

  modelFor(tier: ModelTier): string {
    return tier === "quality" ? this.models.quality : this.models.fast;
  }

  async complete(opts: CompleteOpts): Promise<string> {
    const output_config = opts.schema
      ? { effort: "low" as const, format: { type: "json_schema" as const, schema: opts.schema } }
      : { effort: "low" as const };
    const args = {
      model: this.modelFor(opts.tier),
      max_tokens: opts.maxTokens ?? 2000,
      system: opts.system,
      messages: [{ role: "user" as const, content: opts.content as Anthropic.MessageParam["content"] }],
      output_config,
    };
    const res = (
      opts.tier === "quality"
        ? await this.client.beta.messages.create({ betas: [FALLBACK_BETA], fallbacks: "default", ...args } as never)
        : await this.client.messages.create(args as never)
    ) as unknown as RawResponse;

    if (res.stop_reason === "refusal") throw new Error("model refusal");
    const block = res.content.find((b) => b.type === "text");
    if (!block || typeof block.text !== "string") throw new Error("no text block in response");
    return block.text;
  }

  async json<T>(opts: JsonOpts<T>): Promise<T> {
    const text = await this.complete(opts);
    return opts.validate(parseJsonText(text));
  }

  async stream(opts: StreamOpts): Promise<StreamResult> {
    const args = {
      model: this.modelFor(opts.tier),
      max_tokens: opts.maxTokens ?? 2000,
      system: opts.system,
      messages: opts.messages as unknown as Anthropic.MessageParam[],
      tools: opts.tools.map(toTool),
      tool_choice: { type: "auto" as const },
      output_config: { effort: "low" as const },
    };
    const stream = (
      opts.tier === "quality"
        ? this.client.beta.messages.stream({ betas: [FALLBACK_BETA], fallbacks: "default", ...args } as never)
        : this.client.messages.stream(args as never)
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
    const toolUses: ToolUse[] = final.content
      .filter((b) => b.type === "tool_use" && typeof b.name === "string")
      .map((b) => ({ name: b.name as string, input: b.input }));
    return { text, toolUses };
  }
}
