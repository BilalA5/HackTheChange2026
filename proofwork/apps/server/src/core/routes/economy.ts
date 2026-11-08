import { PLANS } from "@pw/shared";
import type { FastifyInstance } from "fastify";
import { changePlan, creditsSummary, topUp } from "../services/credits.ts";
import { computeProgress } from "../services/progress.ts";
import { listNotifications, markAllRead, markRead } from "../services/notifications.ts";
import type { Core } from "../types.ts";
import { asObject, reqEnum, reqNum } from "../validate.ts";
import { notFound } from "../errors.ts";
import { param } from "./helpers.ts";

export function registerEconomyRoutes(api: FastifyInstance, core: Core): void {
  api.get("/progress", async (req) => computeProgress(core, req.userId));

  api.get("/credits", async (req) => creditsSummary(core, req.userId));
  api.get("/plans", async () => PLANS);
  api.post("/credits/plan", async (req) => {
    const plan = reqEnum(asObject(req.body), "plan", PLANS.map((p) => p.id));
    return changePlan(core, req.userId, plan);
  });
  api.post("/credits/topup", async (req) => {
    const amount = reqNum(asObject(req.body), "amount", { min: 100, max: 50_000, integer: true });
    return topUp(core, req.userId, amount);
  });

  api.get("/notifications", async (req) => listNotifications(core.db, req.userId));
  api.post("/notifications/read-all", async (req) => {
    markAllRead(core.db, req.userId);
    return { ok: true as const };
  });
  api.post("/notifications/:id/read", async (req) => {
    if (!markRead(core.db, req.userId, param(req, "id"))) throw notFound("Notification not found.");
    return { ok: true as const };
  });
}
