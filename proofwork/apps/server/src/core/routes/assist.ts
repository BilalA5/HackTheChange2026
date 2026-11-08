import type { FastifyInstance } from "fastify";
import { coachChat, coachHistory, fileBugReport, listChat, supportMessage } from "../services/assist.ts";
import type { Core } from "../types.ts";

export function registerAssistRoutes(api: FastifyInstance, core: Core): void {
  api.post("/coach/chat", async (req) => coachChat(core, req.userId, req.body));
  api.get("/coach/history", async (req) => coachHistory(core.db, req.userId));

  api.post("/support/bug", async (req) => fileBugReport(core, req.userId, req.body));
  api.get("/support/thread", async (req) => listChat(core.db, req.userId, "support"));
  api.post("/support/thread", async (req) => supportMessage(core, req.userId, req.body));
}
