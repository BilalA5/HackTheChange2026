// AI engine factory. Provider selection:
//   1. PW_AI_PROVIDER = "gemini" | "anthropic" | "practice" (alias "mock") wins when set.
//   2. Otherwise GEMINI_API_KEY -> gemini, else ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN -> anthropic.
//   3. Otherwise the deterministic practice (mock) engine, which keeps the product demoable offline.
// Live calls fall back to the practice engine on any error, so a provider outage never breaks the app.
import type { AiEngine } from "../contracts.ts";
import type { LlmClient, Models } from "./llm.ts";
import { GeminiClient } from "./providers/gemini.ts";
import { AnthropicClient } from "./providers/anthropic.ts";
import { createMockEngine } from "./mock/index.ts";
import { createLiveEngine } from "./live/index.ts";

export type ProviderChoice = "gemini" | "anthropic" | "mock";

type Env = NodeJS.ProcessEnv;

export function resolveProvider(opts?: { mode?: "live" | "mock" }, env: Env = process.env): ProviderChoice {
  if (opts?.mode === "mock") return "mock";
  const explicit = (env.PW_AI_PROVIDER ?? "").trim().toLowerCase();
  if (explicit === "gemini" || explicit === "anthropic" || explicit === "mock") return explicit;
  if (explicit === "practice" || explicit === "offline") return "mock";
  if (env.PW_AI_MODE === "mock") return "mock";
  if (env.GEMINI_API_KEY?.trim()) return "gemini";
  if (env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN) return "anthropic";
  return "mock";
}

/** Model ids for a provider. The practice engine reports "practice" for both tiers. */
export function resolveModels(provider: ProviderChoice, env: Env = process.env): Models {
  if (provider === "gemini") {
    return {
      quality: env.PW_GEMINI_MODEL_QUALITY || "gemini-3.8-flash",
      fast: env.PW_GEMINI_MODEL_FAST || "gemini-3.5-flash-lite",
    };
  }
  if (provider === "anthropic") {
    return { quality: env.PW_MODEL_QUALITY || "claude-opus-5-5", fast: env.PW_MODEL_FAST || "claude-haiku-5-5" };
  }
  return { quality: "practice", fast: "practice" };
}

function createClient(provider: "gemini" | "anthropic", env: Env): LlmClient | null {
  if (provider === "gemini") {
    const apiKey = env.GEMINI_API_KEY?.trim();
    if (!apiKey) return null;
    return new GeminiClient({ apiKey, models: resolveModels("gemini", env) });
  }
  if (!(env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN)) return null;
  return new AnthropicClient(resolveModels("anthropic", env));
}

export function createAiEngine(opts?: { mode?: "live" | "mock" }, env: Env = process.env): AiEngine {
  const provider = resolveProvider(opts, env);
  if (provider === "mock") return createMockEngine(resolveModels("mock", env));

  const llm = createClient(provider, env);
  if (!llm) {
    console.warn(`[ai] provider ${provider} has no credentials; using the practice engine`);
    return createMockEngine(resolveModels("mock", env));
  }
  return createLiveEngine(llm);
}

export type { AiEngine } from "../contracts.ts";
