// Structural checks for authored content. Run: npm test -w @pw/content
import { test } from "node:test";
import assert from "node:assert/strict";
import { careerPacks, careers, trainings, jobs } from "./index.ts";
import { validateCareerPack, validateJobs, validateTrainings } from "./validate.ts";

test("every authored career pack is valid", () => {
  assert.equal(careerPacks.length, 3);
  for (const pack of careerPacks) assert.deepEqual(validateCareerPack(pack), [], pack.career.id);
});

test("ids are unique across packs", () => {
  const all = careerPacks.flatMap((p) => [
    p.career.id,
    ...p.companies.map((c) => c.id),
    ...p.npcs.map((n) => n.id),
    ...p.scenarios.flatMap((s) => [s.id, ...s.stages.map((st) => st.id), ...s.kickoff.segments.map((k) => k.id)]),
  ]);
  assert.equal(new Set(all).size, all.length);
});

test("trainings and jobs", () => {
  const ids = careers.map((c) => c.id);
  assert.ok(trainings.length >= 15);
  for (const kind of ["skill", "mindset", "communication"] as const)
    assert.ok(trainings.filter((t) => t.kind === kind).length >= 4, `≥4 ${kind} trainings`);
  assert.deepEqual(validateTrainings(trainings, ids), []);
  assert.ok(jobs.length >= 12);
  assert.deepEqual(validateJobs(jobs, ids), []);
});
