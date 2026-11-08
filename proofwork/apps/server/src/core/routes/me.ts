import type { FastifyInstance } from "fastify";
import { deleteMe, exportMe, getMe, updateMe } from "../services/me.ts";
import { addToLibrary, recordLesson, removeFromLibrary, requireTrainingId, trainingState } from "../services/trainings.ts";
import type { Core } from "../types.ts";
import { param } from "./helpers.ts";

export function registerMeRoutes(api: FastifyInstance, core: Core): void {
  api.get("/me", async (req) => getMe(core, req.userId));
  api.patch("/me", async (req) => updateMe(core, req.userId, req.body));
  api.delete("/me", async (req) => deleteMe(core, req.userId));
  api.get("/me/export", async (req) => exportMe(core, req.userId));

  api.get("/me/trainings", async (req) => trainingState(core, req.userId));
  api.post("/me/trainings", async (req) => addToLibrary(core, req.userId, requireTrainingId(req.body)));
  api.delete("/me/trainings/:id", async (req) => removeFromLibrary(core, req.userId, param(req, "id")));
  api.post("/me/trainings/:id/progress", async (req) => recordLesson(core, req.userId, param(req, "id"), req.body));
}
