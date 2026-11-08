import type { FastifyInstance } from "fastify";
import { badRequest } from "../errors.ts";
import type { Core } from "../types.ts";
import { param } from "./helpers.ts";

export const SERVER_VERSION = "0.1.0";

export function registerSystemRoutes(api: FastifyInstance, core: Core): void {
  api.get("/health", { config: { public: true } }, async () => ({
    ok: true as const,
    aiMode: core.ai.mode,
    models: core.ai.models,
    version: SERVER_VERSION,
  }));

  api.get("/ota/:channel", { config: { public: true } }, async (req) => {
    const channel = param(req, "channel");
    if (!/^[a-z0-9-]{1,32}$/.test(channel)) throw badRequest("Invalid channel.");
    return {
      channel,
      version: process.env.PW_LATEST_VERSION ?? SERVER_VERSION,
      notes: "You're up to date.",
      url: null,
      publishedAt: process.env.PW_LATEST_PUBLISHED_AT ?? "2026-01-01T00:00:00.000Z",
    };
  });
}
