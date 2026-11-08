// Mounts every REST route under /api and enforces Bearer auth on all non-public routes.
import type { FastifyInstance, FastifyRequest } from "fastify";
import { unauthorized } from "../errors.ts";
import type { Core } from "../types.ts";
import { userIdFromToken } from "../services/auth.ts";
import { registerAuthRoutes } from "./auth.ts";
import { registerCatalogRoutes } from "./catalog.ts";
import { registerCareerRoutes } from "./career.ts";
import { registerAssistRoutes } from "./assist.ts";
import { registerEconomyRoutes } from "./economy.ts";

import { registerMeRoutes } from "./me.ts";
import { registerObjectiveRoutes } from "./objectives.ts";
import { registerOnboardingRoutes } from "./onboarding.ts";
import { registerSystemRoutes } from "./system.ts";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
  interface FastifyContextConfig {
    /** Route is reachable without a Bearer token. */
    public?: boolean;
  }
}

function authenticate(core: Core) {
  return async (req: FastifyRequest): Promise<void> => {
    if (req.routeOptions.config.public) return;
    const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization ?? "");
    if (!match?.[1]) throw unauthorized();
    const userId = await userIdFromToken(core, match[1]);
    if (!userId) throw unauthorized("Your session expired. Sign in again.");
    req.userId = userId;
  };
}

export function registerApiRoutes(api: FastifyInstance, core: Core): void {
  api.addHook("onRequest", authenticate(core));
  registerSystemRoutes(api, core);
  registerAuthRoutes(api, core);
  registerMeRoutes(api, core);
  registerOnboardingRoutes(api, core);
  registerCatalogRoutes(api, core);
  registerObjectiveRoutes(api, core);
  registerEconomyRoutes(api, core);
  registerCareerRoutes(api, core);
  registerAssistRoutes(api, core);

}
