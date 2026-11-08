import type { FastifyInstance } from "fastify";
import { sessionTurn, startSession } from "../services/onboarding.ts";
import type { Core } from "../types.ts";

export function registerOnboardingRoutes(api: FastifyInstance, core: Core): void {
  api.post("/onboarding/session-start", async (req) => startSession(core, req.userId));

  api.post("/onboarding/session-turn", async (req, reply) => {
    const result = await sessionTurn(core, req.userId, req.body);
    return reply.code(result.status).send(result.view);
  });
}
