// Optional live smoke test against the real Gemini API. Runs only with PW_LIVE_TESTS=1.
// Loads the project .env with the server's own loader; the key is never printed. Only timings and titles are logged.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import type { PathRequest, User } from "@pw/shared";
import { trainings, validateCareerPack, validateJobs } from "@pw/content";
import { loadDotEnv } from "../src/core/env.ts";
import { createAiEngine, resolveModels } from "../src/ai/index.ts";
import { GeminiClient } from "../src/ai/providers/gemini.ts";

const LIVE = process.env.PW_LIVE_TESTS === "1";
if (LIVE) loadDotEnv(fileURLToPath(new URL("../../../.env", import.meta.url)));
const hasKey = Boolean(process.env.GEMINI_API_KEY?.trim());

test("live smoke: one json() call and one generatePath() against Gemini", { skip: !LIVE || !hasKey, timeout: 240_000 }, async () => {
  // 1. A structured call through the client the engine uses.
  const llm = new GeminiClient({ apiKey: process.env.GEMINI_API_KEY as string, models: resolveModels("gemini") });
  const t0 = Date.now();
  const probe = await llm.json({
    tier: "fast",
    system: "You answer with JSON only.",
    content: "Reply with ok set to true and city set to Calgary.",
    schema: {
      type: "object",
      properties: { ok: { type: "boolean" }, city: { type: "string" } },
      required: ["ok", "city"],
    },
    maxTokens: 200,
    validate: (v) => {
      const o = v as { ok?: unknown; city?: unknown };
      if (o.ok !== true || typeof o.city !== "string") throw new Error("unexpected json shape");
      return o as { ok: boolean; city: string };
    },
  });
  console.log(`[live] json() fast tier: ${Date.now() - t0} ms, city=${probe.city}`);
  assert.equal(probe.ok, true);

  // 2. A full personal path through the engine. It falls back to practice on error, so check the engine label too.
  const request: PathRequest = {
    targetRole: "Energy Analyst",
    level: "Mid-level",
    industry: "Energy",
    companyType: "Enterprise",
    location: "Calgary",
    timeline: "3 months",
    why: "I want to help the grid run on renewables",
  };
  const user = { id: "live", name: "Live Test", email: "live@example.test", vision: null } as unknown as User;
  const engine = createAiEngine({ mode: "live" });
  assert.equal(engine.provider, "gemini");

  const t1 = Date.now();
  const path = await engine.generatePath({ request, user, idPrefix: `g-live-${Date.now().toString(36)}`, trainings });
  console.log(`[live] generatePath: ${Date.now() - t1} ms, engine=${path.engine}`);
  for (const s of path.pack.scenarios) console.log(`[live]   project ${s.order}: ${s.title}`);
  assert.equal(path.engine, "live", "the live model built the path (no practice fallback)");

  assert.deepEqual(validateCareerPack(path.pack), []);
  assert.deepEqual(validateJobs(path.jobs, [path.pack.career.id]), []);
  assert.ok(path.recommendedTrainingIds.length <= 8);
});
