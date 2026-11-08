// Structural checks for authored content. Run: npm test -w @pw/content
import { test } from "node:test";
import assert from "node:assert/strict";
import { careerPacks, careers, companies, npcs, scenarios, trainings, jobs } from "./index.ts";
import { RUBRIC_AXES } from "@pw/shared";

const unique = (ids: string[], label: string) => {
  const seen = new Set<string>();
  for (const id of ids) {
    assert.ok(!seen.has(id), `duplicate ${label} id: ${id}`);
    seen.add(id);
  }
};

test("ids are unique", () => {
  unique(careers.map((c) => c.id), "career");
  unique(companies.map((c) => c.id), "company");
  unique(npcs.map((n) => n.id), "npc");
  unique(scenarios.map((s) => s.id), "scenario");
  unique(trainings.map((t) => t.id), "training");
  unique(jobs.map((j) => j.id), "job");
  unique(scenarios.flatMap((s) => s.stages.map((st) => st.id)), "stage");
  unique(scenarios.flatMap((s) => s.kickoff.segments.map((k) => k.id)), "segment");
});

test("each career pack is complete and consistent", () => {
  assert.equal(careerPacks.length, 3);
  for (const pack of careerPacks) {
    assert.equal(pack.scenarios.length, 3, `${pack.career.id} needs 3 scenarios`);
    assert.deepEqual(pack.scenarios.map((s) => s.order).sort(), [1, 2, 3]);
    for (const s of pack.scenarios) {
      assert.equal(s.careerId, pack.career.id);
      assert.ok(pack.companies.some((c) => c.id === s.companyId), `${s.id}: unknown company ${s.companyId}`);
      const npc = pack.npcs.find((n) => n.id === s.npcId);
      assert.ok(npc, `${s.id}: unknown npc ${s.npcId}`);
      assert.equal(npc!.companyId, s.companyId, `${s.id}: npc works at another company`);
      assert.equal(s.kickoff.segments.length, 3, `${s.id}: kickoff needs 3 segments`);
      assert.deepEqual(s.kickoff.segments.map((k) => k.noteSection), ["problem", "outcome", "process"]);
      for (const seg of s.kickoff.segments) {
        assert.ok(seg.slides.length >= 2, `${seg.id}: ≥2 slides`);
        assert.ok(seg.rubricPoints.length >= 3, `${seg.id}: ≥3 rubric points`);
        const words = seg.transcript.split(/\s+/).length;
        assert.ok(words >= 60 && words <= 220, `${seg.id}: transcript ${words} words`);
      }
      assert.ok(s.pou.length >= 2, `${s.id}: ≥2 PoU questions`);
      assert.ok(s.stages.length >= 3 && s.stages.length <= 5, `${s.id}: 3-5 stages`);
      assert.equal(s.stages.at(-1)!.kind, "presentation", `${s.id}: last stage must be the presentation`);
      assert.equal(s.stages.filter((st) => st.kind === "presentation").length, 1);
      s.stages.forEach((st, i) => {
        assert.equal(st.order, i + 1, `${st.id}: order`);
        assert.ok(st.requirements.length >= 3, `${st.id}: ≥3 requirements`);
        assert.ok(st.learn.length >= 1, `${st.id}: ≥1 learn item`);
        for (const ax of RUBRIC_AXES) assert.ok(st.rubricHints[ax], `${st.id}: rubric hint ${ax}`);
        for (const li of st.learn) if (li.check) assert.ok(li.check.answerIndex < li.check.options.length);
      });
      const stageXp = s.stages.reduce((a, st) => a + st.xp, 0);
      assert.ok(stageXp <= s.maxXp, `${s.id}: stage xp ${stageXp} > maxXp ${s.maxXp}`);
      assert.ok(s.map.x >= 5 && s.map.x <= 95 && s.map.y >= 5 && s.map.y <= 95, `${s.id}: map position`);
    }
  }
});

test("trainings and jobs", () => {
  assert.ok(trainings.length >= 15);
  for (const kind of ["skill", "mindset", "communication"] as const)
    assert.ok(trainings.filter((t) => t.kind === kind).length >= 4, `≥4 ${kind} trainings`);
  for (const t of trainings) {
    assert.ok(t.lessons.length >= 2, `${t.id}: ≥2 lessons`);
    for (const c of t.recommendedFor) assert.ok(careers.some((x) => x.id === c), `${t.id}: unknown career ${c}`);
  }
  assert.ok(jobs.length >= 12);
  for (const j of jobs) {
    assert.ok(careers.some((c) => c.id === j.careerId), `${j.id}: unknown career`);
    assert.ok(j.applyFields.length >= 4, `${j.id}: ≥4 apply fields`);
  }
});
