import type { FastifyInstance } from "fastify";
import { draftApplication, listApplications, listJobs, updateApplication } from "../services/jobs.ts";
import { getPortfolio, updatePortfolio } from "../services/portfolio.ts";
import type { Core } from "../types.ts";
import { param } from "./helpers.ts";

export function registerCareerRoutes(api: FastifyInstance, core: Core): void {
  api.get("/portfolio", async (req) => getPortfolio(core, req.userId));
  api.patch("/portfolio", async (req) => updatePortfolio(core, req.userId, req.body));

  api.get("/jobs", async (req) => listJobs(core, req.userId));
  api.post("/jobs/:id/applications", async (req) => draftApplication(core, req.userId, param(req, "id")));
  api.get("/applications", async (req) => listApplications(core.db, req.userId));
  api.patch("/applications/:id", async (req) => updateApplication(core, req.userId, param(req, "id"), req.body));
}
