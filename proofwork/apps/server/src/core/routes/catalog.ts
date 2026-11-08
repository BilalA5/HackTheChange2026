import type { FastifyInstance } from "fastify";
import { notFound } from "../errors.ts";
import { scenarioCards, scenarioDetail } from "../services/catalog.ts";
import { requireUser } from "../services/users.ts";
import type { Core } from "../types.ts";
import { param, queryParam } from "./helpers.ts";
import type { FastifyRequest } from "fastify";

export function registerCatalogRoutes(api: FastifyInstance, core: Core): void {
  api.get("/careers", async () => core.content.careers);

  api.get("/scenarios", async (req: FastifyRequest) => {
    const user = requireUser(core.db, req.userId);
    const careerId = queryParam(req, "careerId") ?? user.careerId ?? core.content.careers[0]?.id;
    if (!careerId) return [];
    if (!core.content.getCareer(careerId)) throw notFound("Career not found.");
    return scenarioCards(core, req.userId, careerId);
  });

  api.get("/scenarios/:id", async (req) => scenarioDetail(core, param(req, "id")));

  api.get("/trainings", async () => core.content.trainings);
}
