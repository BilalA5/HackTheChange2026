// AI engine factory. Live when Claude credentials are present (or PW_AI_MODE=live); otherwise the
// deterministic mock, which keeps the whole product demoable offline.
import type { AiEngine } from "../contracts.ts";
import { Llm, type Models } from "./llm.ts";
import { createMockEngine } from "./mock/index.ts";
import { createLiveEngine } from "./live/index.ts";

export function resolveModels(env: NodeJS.ProcessEnv = process.env): Models {
  return {
    quality: env.PW_MODEL_QUALITY || "claude-opus-5-5",
    fast: env.PW_MODEL_FAST || "claude-haiku-5-5",
  };
}

export function resolveMode(opts?: { mode?: "live" | "mock" }, env: NodeJS.ProcessEnv = process.env): "live" | "mock" {
  if (opts?.mode) return opts.mode;
  if (env.PW_AI_MODE === "live") return "live";
  if (env.PW_AI_MODE === "mock") return "mock";
  const hasKey = Boolean(env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN);
  return hasKey ? "live" : "mock";
}

export function createAiEngine(opts?: { mode?: "live" | "mock" }): AiEngine {
  const models = resolveModels();
  const mode = resolveMode(opts);
  if (mode === "live") return createLiveEngine(models, new Llm(models));
  return createMockEngine(models);
}

export type { AiEngine } from "../contracts.ts";
