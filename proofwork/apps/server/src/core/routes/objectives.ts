import type { FastifyInstance } from "fastify";
import {
  answerPou,
  askKickoff,
  completeKickoff,
  createObjective,
  getUserObjective,
  listUserObjectives,
  markWatched,
  notesCheck,
  patchObjective,
  recordTime,
  startPou,
} from "../services/objectives.ts";
import {
  completeLearnItem,
  learnChat,
  planMessage,
  setStageMode,
  setTodos,
  startStage,
  submitPresentation,
  submitWork,
} from "../services/stages.ts";
import type { Core } from "../types.ts";
import { asObject, reqStr } from "../validate.ts";
import { param } from "./helpers.ts";

export function registerObjectiveRoutes(api: FastifyInstance, core: Core): void {
  api.get("/objectives", async (req) => listUserObjectives(core, req.userId));
  api.post("/objectives", async (req) => createObjective(core, req.userId, reqStr(asObject(req.body), "scenarioId", { max: 128 })));
  api.get("/objectives/:id", async (req) => getUserObjective(core, req.userId, param(req, "id")));
  api.patch("/objectives/:id", async (req) => patchObjective(core, req.userId, param(req, "id"), req.body));
  api.post("/objectives/:id/time", async (req) => recordTime(core, req.userId, param(req, "id"), req.body));

  api.post("/objectives/:id/kickoff/watched", async (req) => markWatched(core, req.userId, param(req, "id"), req.body));
  api.post("/objectives/:id/kickoff/notes-check", async (req) => notesCheck(core, req.userId, param(req, "id"), req.body));
  api.post("/objectives/:id/kickoff/ask", async (req) => askKickoff(core, req.userId, param(req, "id"), req.body));
  api.post("/objectives/:id/kickoff/complete", async (req) => completeKickoff(core, req.userId, param(req, "id")));

  api.post("/objectives/:id/pou/start", async (req) => startPou(core, req.userId, param(req, "id")));
  api.post("/objectives/:id/pou/answer", async (req) => answerPou(core, req.userId, param(req, "id"), req.body));

  api.post("/objectives/:id/stages/:stageId/start", async (req) => startStage(core, req.userId, param(req, "id"), param(req, "stageId")));
  api.post("/objectives/:id/stages/:stageId/mode", async (req) =>
    setStageMode(core, req.userId, param(req, "id"), param(req, "stageId"), req.body),
  );
  api.post("/objectives/:id/stages/:stageId/plan", async (req) =>
    planMessage(core, req.userId, param(req, "id"), param(req, "stageId"), req.body),
  );
  api.post("/objectives/:id/stages/:stageId/learn/chat", async (req) =>
    learnChat(core, req.userId, param(req, "id"), param(req, "stageId"), req.body),
  );
  api.post("/objectives/:id/stages/:stageId/learn/:itemId/complete", async (req) =>
    completeLearnItem(core, req.userId, param(req, "id"), param(req, "stageId"), param(req, "itemId")),
  );
  api.post("/objectives/:id/stages/:stageId/todos", async (req) =>
    setTodos(core, req.userId, param(req, "id"), param(req, "stageId"), req.body),
  );
  api.post("/objectives/:id/stages/:stageId/submit", async (req) =>
    submitWork(core, req.userId, param(req, "id"), param(req, "stageId"), req.body),
  );
  api.post("/objectives/:id/stages/:stageId/presentation", async (req) =>
    submitPresentation(core, req.userId, param(req, "id"), param(req, "stageId"), req.body),
  );
}
