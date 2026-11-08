// Provider-neutral LLM interface. Concrete clients live in ./providers (Gemini, Anthropic); nothing outside
// those two files knows which provider is serving a call. Owns the shared request/response types, JSON
// parsing and log-safe error descriptions.
import type { ModelTier } from "../contracts.ts";

export type { ModelTier };

export interface Models {
  quality: string;
  fast: string;
}

export type JsonSchema = Record<string, unknown>;

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: "image/jpeg" | "image/png"; data: string } };

export type Content = string | ContentBlock[];

export interface ChatTurn {
  role: "user" | "assistant";
  content: Content;
}

/** A callable tool. `parameters` is a plain JSON Schema object. */
export interface ToolDef {
  name: string;
  description: string;
  parameters: JsonSchema;
}

export interface ToolUse {
  name: string;
  input: unknown;
}

export interface CompleteOpts {
  tier: ModelTier;
  system: string;
  content: Content;
  maxTokens?: number;
  /** When set, the model is constrained to this JSON Schema and must answer JSON only. */
  schema?: JsonSchema;
  /** Request timeout. Providers apply their own default when omitted (90 s). */
  timeoutMs?: number;
  /** "low" trades reasoning depth for latency on long generation calls. Providers without the setting ignore it. */
  thinking?: "low";
}

export interface JsonOpts<T> extends CompleteOpts {
  schema: JsonSchema;
  /** Checks and narrows the parsed JSON. Throws when the shape is unusable. */
  validate: (value: unknown) => T;
}

export interface StreamOpts {
  tier: ModelTier;
  system: string;
  messages: ChatTurn[];
  tools: ToolDef[];
  maxTokens?: number;
  timeoutMs?: number;
  onDelta: (delta: string) => void;
}

export interface StreamResult {
  text: string;
  toolUses: ToolUse[];
}

export interface LlmClient {
  readonly provider: "gemini" | "anthropic";
  readonly models: Models;
  /** One request, returns the text of the reply. */
  complete(o: CompleteOpts): Promise<string>;
  /** Structured JSON constrained to `schema`, parsed and then validated by the caller. */
  json<T>(o: JsonOpts<T>): Promise<T>;
  /** Streams text through onDelta and returns the tool calls of the final message. One-shot. */
  stream(o: StreamOpts): Promise<StreamResult>;
}

/** Parse model JSON. Tolerates a fenced ```json block in case a provider wraps its answer. */
export function parseJsonText(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (fenced) return JSON.parse(fenced[1]);
    throw new Error("model did not return valid JSON");
  }
}

/** Short, log-safe description of an error: status (when present) and message only. */
export function describeError(err: unknown): string {
  if (err instanceof Error) {
    const status = (err as { status?: unknown }).status;
    return typeof status === "number" ? `status ${status}: ${err.message}` : err.message;
  }
  return String(err);
}

/** Parse a data URL into a base64 image block, or null when it is not a jpeg/png data URL. */
export function imageBlock(dataUrl: string | undefined): ContentBlock | null {
  if (!dataUrl) return null;
  const m = dataUrl.match(/^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return null;
  return { type: "image", source: { type: "base64", media_type: m[1] as "image/jpeg" | "image/png", data: m[2] } };
}
