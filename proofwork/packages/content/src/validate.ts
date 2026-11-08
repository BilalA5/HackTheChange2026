// Structural rules for a career path. Used by the authored-content test and by the path generators,
// which must only ever hand the server packs that pass these checks.
import { RUBRIC_AXES, type CareerPack, type Job, type Training } from "@pw/shared";

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

/** Returns human-readable problems; an empty array means the pack is valid. */
export function validateCareerPack(pack: CareerPack): string[] {
  const problems: string[] = [];
  const fail = (msg: string) => problems.push(msg);
  const { career, companies, npcs, scenarios } = pack;

  const ids = new Set<string>();
  const unique = (id: string, label: string) => {
    if (!id) fail(`empty ${label} id`);
    if (ids.has(id)) fail(`duplicate id: ${id} (${label})`);
    ids.add(id);
  };
  unique(career.id, "career");
  if (!career.title?.trim()) fail("career title is empty");
  if (!/^#[0-9a-fA-F]{6}$/.test(career.color ?? "")) fail(`career colour must be #rrggbb: ${career.color}`);
  companies.forEach((c) => {
    unique(c.id, "company");
    if (!/^#[0-9a-fA-F]{6}$/.test(c.color ?? "")) fail(`${c.id}: colour must be #rrggbb`);
    if (!c.glyph || c.glyph.length > 2) fail(`${c.id}: glyph must be 1-2 characters`);
  });
  npcs.forEach((n) => unique(n.id, "npc"));

  if (scenarios.length !== 3) fail(`${career.id}: needs 3 scenarios, has ${scenarios.length}`);
  const orders = scenarios.map((s) => s.order).sort();
  if (orders.join(",") !== "1,2,3") fail(`${career.id}: scenario orders must be 1,2,3`);

  for (const s of scenarios) {
    unique(s.id, "scenario");
    if (s.careerId !== career.id) fail(`${s.id}: careerId ${s.careerId} != ${career.id}`);
    if (!companies.some((c) => c.id === s.companyId)) fail(`${s.id}: unknown company ${s.companyId}`);
    const npc = npcs.find((n) => n.id === s.npcId);
    if (!npc) fail(`${s.id}: unknown npc ${s.npcId}`);
    else if (npc.companyId !== s.companyId) fail(`${s.id}: npc works at another company`);
    if (s.kickoff.segments.length !== 3) fail(`${s.id}: kickoff needs 3 segments`);
    if (s.kickoff.segments.map((k) => k.noteSection).join(",") !== "problem,outcome,process")
      fail(`${s.id}: segments must be problem, outcome, process`);
    for (const seg of s.kickoff.segments) {
      unique(seg.id, "segment");
      if (seg.slides.length < 2) fail(`${seg.id}: needs at least 2 slides`);
      if (seg.rubricPoints.length < 3) fail(`${seg.id}: needs at least 3 rubric points`);
      const w = words(seg.transcript);
      if (w < 60 || w > 220) fail(`${seg.id}: transcript is ${w} words (60-220)`);
    }
    if (s.pou.length < 2) fail(`${s.id}: needs at least 2 PoU questions`);
    s.pou.forEach((q) => {
      unique(q.id, "pou");
      if (q.rubricPoints.length < 2) fail(`${q.id}: needs at least 2 rubric points`);
    });
    if (s.stages.length < 3 || s.stages.length > 5) fail(`${s.id}: needs 3-5 stages`);
    if (s.stages.at(-1)?.kind !== "presentation") fail(`${s.id}: last stage must be the presentation`);
    if (s.stages.filter((st) => st.kind === "presentation").length !== 1) fail(`${s.id}: exactly one presentation stage`);
    s.stages.forEach((st, i) => {
      unique(st.id, "stage");
      if (st.order !== i + 1) fail(`${st.id}: order must be ${i + 1}`);
      if (st.requirements.length < 3) fail(`${st.id}: needs at least 3 requirements`);
      if (st.learn.length < 1) fail(`${st.id}: needs at least 1 learn item`);
      if (st.submission.kinds.length < 1) fail(`${st.id}: needs at least 1 submission kind`);
      for (const ax of RUBRIC_AXES) if (!st.rubricHints?.[ax]) fail(`${st.id}: missing rubric hint ${ax}`);
      for (const li of st.learn) {
        unique(li.id, "learn");
        if (li.check && (li.check.answerIndex < 0 || li.check.answerIndex >= li.check.options.length))
          fail(`${li.id}: check answerIndex out of range`);
      }
    });
    const stageXp = s.stages.reduce((a, st) => a + st.xp, 0);
    if (stageXp > s.maxXp) fail(`${s.id}: stage xp ${stageXp} > maxXp ${s.maxXp}`);
    if (!(s.map.x >= 5 && s.map.x <= 95 && s.map.y >= 5 && s.map.y <= 95)) fail(`${s.id}: map position out of range`);
  }
  return problems;
}

export function validateJobs(jobs: Job[], careerIds: string[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const j of jobs) {
    if (seen.has(j.id)) problems.push(`duplicate job id: ${j.id}`);
    seen.add(j.id);
    if (!careerIds.includes(j.careerId)) problems.push(`${j.id}: unknown career ${j.careerId}`);
    if (j.applyFields.length < 4) problems.push(`${j.id}: needs at least 4 apply fields`);
    for (const key of ["full_name", "email"]) if (!j.applyFields.some((f) => f.key === key)) problems.push(`${j.id}: missing ${key}`);
  }
  return problems;
}

export function validateTrainings(trainings: Training[], careerIds: string[]): string[] {
  const problems: string[] = [];
  for (const t of trainings) {
    if (t.lessons.length < 2) problems.push(`${t.id}: needs at least 2 lessons`);
    for (const c of t.recommendedFor) if (!careerIds.includes(c)) problems.push(`${t.id}: unknown career ${c}`);
  }
  return problems;
}
