import type { FastifyInstance } from "fastify";
import { notFound } from "../errors.ts";
import { scenarioCards, scenarioDetail } from "../services/catalog.ts";
import { requireUser } from "../services/users.ts";
import type { Core } from "../types.ts";
import { contentFor } from "../user-content.ts";
import { param, queryParam } from "./helpers.ts";
import type { FastifyRequest } from "fastify";

export function registerCatalogRoutes(api: FastifyInstance, core: Core): void {
  api.get("/careers", async (req) => contentFor(core, req.userId).careers);

  api.get("/scenarios", async (req: FastifyRequest) => {
    const user = requireUser(core.db, req.userId);
    const content = contentFor(core, req.userId);
    const careerId = queryParam(req, "careerId") ?? user.careerId ?? content.careers[0]?.id;
    if (!careerId) return [];
    if (!content.getCareer(careerId)) throw notFound("Career not found.");
    return scenarioCards(core, req.userId, careerId);
  });

  api.get("/scenarios/:id", async (req) => scenarioDetail(core, req.userId, param(req, "id")));

  api.get("/trainings", async (req) => contentFor(core, req.userId).trainings);
}
