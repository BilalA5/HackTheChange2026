import type { FastifyInstance } from "fastify";
import { deleteMe, exportMe, getMe, updateMe } from "../services/me.ts";
import { createPath, currentPathSummary, parsePathRequest } from "../services/paths.ts";
import { scenarioCards } from "../services/catalog.ts";
import { requireUser } from "../services/users.ts";
import { contentFor } from "../user-content.ts";
import { addToLibrary, recordLesson, removeFromLibrary, requireTrainingId, trainingState } from "../services/trainings.ts";
import type { Core } from "../types.ts";
import { param } from "./helpers.ts";

export function registerMeRoutes(api: FastifyInstance, core: Core): void {
  api.get("/me", async (req) => getMe(core, req.userId));
  api.patch("/me", async (req) => updateMe(core, req.userId, req.body));
  api.delete("/me", async (req) => deleteMe(core, req.userId));
  api.get("/me/export", async (req) => exportMe(core, req.userId));

  api.get("/me/path", async (req) => ({ path: currentPathSummary(core, req.userId) }));
  api.post("/me/path", async (req) => {
    const user = requireUser(core.db, req.userId);
    const path = await createPath(core, user, parsePathRequest(req.body), { charge: true });
    const career = contentFor(core, req.userId).getCareer(path.careerId);
    return { path, career, scenarios: scenarioCards(core, req.userId, path.careerId) };
  });

  api.get("/me/trainings", async (req) => trainingState(core, req.userId));
  api.post("/me/trainings", async (req) => addToLibrary(core, req.userId, requireTrainingId(req.body)));
  api.delete("/me/trainings/:id", async (req) => removeFromLibrary(core, req.userId, param(req, "id")));
  api.post("/me/trainings/:id/progress", async (req) => recordLesson(core, req.userId, param(req, "id"), req.body));
}
