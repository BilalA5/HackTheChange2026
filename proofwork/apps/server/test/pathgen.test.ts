// Practice-mode path generator: validity for diverse roles, determinism, tailoring, levels and recommendations.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { PathRequest, Training, User } from "@pw/shared";
import { validateCareerPack, validateJobs } from "@pw/content";
import type { GeneratePathInput, GeneratedPath } from "../src/contracts.ts";
import { generatePathPractice, recommendTrainings } from "../src/ai/mock/pathgen/index.ts";
import { detectFamily } from "../src/ai/mock/pathgen/families.ts";
import { detectDomain } from "../src/ai/mock/pathgen/industries.ts";
import { LEARN_TOPICS } from "../src/ai/mock/pathgen/learn.ts";

// ───────────────────────────── fixtures ─────────────────────────────

const lesson = (title: string) => ({ title, body: `${title}. Practice it on a real task this week.` });

const TRAININGS: Training[] = [
  {
    id: "tr-sql-analysis",
    kind: "skill",
    title: "SQL for analysts",
    summary: "Window functions, cohorts and clean joins for analytics work with SQL and dashboards.",
    minutes: 20,
    tags: ["sql", "analytics", "data"],
    recommendedFor: [],
    lessons: [lesson("Joins"), lesson("Window functions")],
  },
  {
    id: "tr-experiment-design",
    kind: "skill",
    title: "Experiment design",
    summary: "Size, run and read experiments so that a result means something to the business.",
    minutes: 15,
    tags: ["experiments", "metrics", "product"],
    recommendedFor: [],
    lessons: [lesson("Sample size"), lesson("Reading results")],
  },
  {
    id: "tr-owning-ambiguity",
    kind: "mindset",
    title: "Owning ambiguous problems",
    summary: "Turn a vague request into a question you can answer, and keep moving when the brief is thin.",
    minutes: 12,
    tags: ["mindset", "ownership", "problem solving"],
    recommendedFor: [],
    lessons: [lesson("Name the question"), lesson("Decide and document")],
  },
  {
    id: "tr-stakeholder-updates",
    kind: "communication",
    title: "Stakeholder updates that get read",
    summary: "Write short status notes that lead with the number and the ask, for busy managers.",
    minutes: 10,
    tags: ["communication", "stakeholders", "writing"],
    recommendedFor: [],
    lessons: [lesson("Lead with the number"), lesson("End with an ask")],
  },
  {
    id: "tr-presenting-data",
    kind: "communication",
    title: "Presenting numbers to decision makers",
    summary: "Five-minute talks with one story, the evidence behind it and a clear next step for leaders.",
    minutes: 18,
    tags: ["presenting", "data", "executives"],
    recommendedFor: [],
    lessons: [lesson("One story"), lesson("Caveats up front")],
  },
  {
    id: "tr-clinical-safety",
    kind: "skill",
    title: "Patient safety basics",
    summary: "Shift handoffs, escalation and documentation standards for clinical teams.",
    minutes: 16,
    tags: ["clinical", "safety", "healthcare"],
    recommendedFor: [],
    lessons: [lesson("Handoffs"), lesson("Escalation")],
  },
];

const REQUESTS: { label: string; request: PathRequest }[] = [
  { label: "Software Engineer", request: { targetRole: "Software Engineer", level: "Junior", industry: "Tech", companyType: "Startup", location: "Remote", timeline: "3 months" } },
  { label: "Energy Analyst", request: { targetRole: "Energy Analyst", level: "Mid", industry: "Energy", companyType: "Enterprise", location: "Calgary, AB", timeline: "6 months" } },
  { label: "Registered Nurse", request: { targetRole: "Registered Nurse", level: "Senior", industry: "Healthcare", companyType: "Scale-up" } },
  { label: "UX Designer", request: { targetRole: "UX Designer" } },
  { label: "Marketing Manager", request: { targetRole: "Marketing Manager", industry: "Retail", companyType: "Scale-up", timeline: "1 month" } },
  { label: "Accountant", request: { targetRole: "Accountant", industry: "Fintech", level: "Entry", location: "Toronto" } },
  { label: "Supply Chain Coordinator", request: { targetRole: "Supply Chain Coordinator", industry: "Logistics", companyType: "Enterprise" } },
  { label: "Machine Learning Engineer", request: { targetRole: "Machine Learning Engineer", level: "Senior", industry: "B2B SaaS" } },
  { label: "Product Manager", request: { targetRole: "Product Manager", industry: "Gaming", level: "Lead" } },
  { label: "Data Scientist", request: { targetRole: "Data Scientist", industry: "Public sector", companyType: "Non-profit" } },
  { label: "HR Business Partner", request: { targetRole: "HR Business Partner", industry: "Travel and hospitality" } },
  { label: "Customer Success Manager", request: { targetRole: "Customer Success Manager", industry: "Education" } },
  { label: "High School Teacher", request: { targetRole: "High School Teacher", industry: "Education", companyType: "Non-profit" } },
  { label: "Civil Engineer", request: { targetRole: "Civil Engineer", industry: "Utilities", location: "Edmonton, AB" } },
  { label: "Game Designer", request: { targetRole: "Game Designer", industry: "Media and entertainment" } },
  { label: "Minimal request", request: { targetRole: "Lawyer" } },
];

function input(request: PathRequest, idPrefix = "g-test-1"): GeneratePathInput {
  return { request, user: { id: "u-test" } as unknown as User, idPrefix, trainings: TRAININGS };
}

function generate(request: PathRequest, idPrefix?: string): GeneratedPath {
  return generatePathPractice(input(request, idPrefix));
}

/** Every string `id` in a value, at any depth. */
function collectIds(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v) => collectIds(v, out));
  else if (value && typeof value === "object") {
    for (const [key, v] of Object.entries(value)) {
      if (key === "id" && typeof v === "string") out.push(v);
      else collectIds(v, out);
    }
  }
  return out;
}

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

// ───────────────────────────── validity ─────────────────────────────

test("every diverse request yields a pack and jobs that pass the validators", () => {
  for (const { label, request } of REQUESTS) {
    const out = generate(request);
    assert.deepEqual(validateCareerPack(out.pack), [], `${label}: career pack`);
    assert.deepEqual(validateJobs(out.jobs, [out.pack.career.id]), [], `${label}: jobs`);
    assert.equal(out.engine, "practice", `${label}: engine`);
    assert.equal(out.jobs.length, 5, `${label}: five jobs`);
    assert.equal(out.pack.scenarios.length, 3, `${label}: three scenarios`);
  }
});

test("every generated id starts with the id prefix", () => {
  const idPrefix = "g-abc123-7";
  for (const { request } of REQUESTS) {
    const out = generate(request, idPrefix);
    const ids = [...collectIds(out.pack), ...collectIds(out.jobs)];
    assert.ok(ids.length > 40, "expected a full path worth of ids");
    for (const id of ids) assert.ok(id.startsWith(idPrefix), `${id} does not start with ${idPrefix}`);
    assert.equal(out.pack.career.id, idPrefix);
    assert.equal(new Set(ids).size, ids.length, "ids must be unique");
  }
});

test("jobs use the career id, a seniority ladder and four auto-applicable roles", () => {
  const out = generate({ targetRole: "Software Engineer", level: "Junior" });
  for (const job of out.jobs) {
    assert.equal(job.careerId, out.pack.career.id);
    assert.ok(job.minLevel >= 0 && job.minLevel <= 4);
    assert.ok(job.requirements.length >= 3 && job.requirements.length <= 5);
    assert.ok(job.applyFields.some((f) => f.key === "motivation" && f.type === "textarea"));
  }
  assert.equal(out.jobs.filter((j) => j.autoApplicable).length, 4);
  assert.match(out.jobs[0].title, /Junior Software Engineer/);
});

test("stages, learn items and transcripts stay within the content rules", () => {
  for (const { label, request } of REQUESTS) {
    const out = generate(request);
    for (const scenario of out.pack.scenarios) {
      const stageXp = scenario.stages.reduce((sum, s) => sum + s.xp, 0);
      assert.ok(scenario.maxXp >= stageXp + 550, `${label}: maxXp covers stage xp plus 550`);
      assert.equal(scenario.maxXp % 5, 0, `${label}: maxXp is a multiple of 5`);
      for (const seg of scenario.kickoff.segments) {
        const w = words(seg.transcript);
        assert.ok(w >= 60 && w <= 220, `${label}: transcript is ${w} words`);
      }
      for (const stage of scenario.stages) {
        assert.ok(stage.requirements.length >= 3, `${label}: ${stage.id} needs requirements`);
        for (const item of stage.learn) {
          const w = words(item.body);
          assert.ok(w >= 150 && w <= 260, `${label}: ${item.id} body is ${w} words`);
          assert.ok(item.check, `${label}: ${item.id} needs a check`);
          assert.equal(item.check?.options.length, 4, `${label}: ${item.id} has four options`);
        }
      }
    }
  }
});

test("copy has no leftover template tokens, no dashes and no lorem ipsum", () => {
  for (const { label, request } of REQUESTS) {
    const text = JSON.stringify(generate(request));
    assert.doesNotMatch(text, /\{[A-Za-z][A-Za-z0-9]*\}/, `${label}: template token left in output`);
    assert.doesNotMatch(text, /[–—]/, `${label}: em or en dash in output`);
    assert.doesNotMatch(text.toLowerCase(), /lorem ipsum/, `${label}: placeholder copy`);
  }
});

// ───────────────────────────── determinism ─────────────────────────────

test("the same input gives a deep-equal output", () => {
  for (const { request } of REQUESTS.slice(0, 5)) {
    assert.deepEqual(generate(request), generate(request));
  }
  // Key order in the request does not change the seed.
  const a = generate({ targetRole: "Data Scientist", industry: "Tech", level: "Mid" });
  const b = generate({ level: "Mid", industry: "Tech", targetRole: "Data Scientist" } as PathRequest);
  assert.deepEqual(a, b);
});

test("different learners get different projects", () => {
  const nurse = generate({ targetRole: "Registered Nurse", industry: "Healthcare" });
  const teacher = generate({ targetRole: "High School Teacher", industry: "Education" });
  assert.notDeepEqual(
    nurse.pack.scenarios.map((s) => s.title),
    teacher.pack.scenarios.map((s) => s.title),
  );
  assert.notEqual(nurse.pack.career.title, teacher.pack.career.title);
});

// ───────────────────────────── tailoring ─────────────────────────────

test("industry and location appear in the companies and transcripts", () => {
  const energy = generate({ targetRole: "Energy Analyst", industry: "Energy", location: "Calgary, AB", companyType: "Enterprise" });
  const text = JSON.stringify(energy.pack);
  assert.ok(text.includes("Energy"), "industry word should appear");
  assert.ok(energy.pack.companies.every((c) => c.tagline.includes("Calgary")), "location should appear in each company tagline");
  assert.ok(energy.pack.companies.every((c) => c.industry === "Energy"));
  assert.ok(energy.pack.companies.every((c) => /enterprise/i.test(c.tagline)), "company type should shape the tagline");
  assert.match(text, /Calgary/);
  for (const job of energy.jobs) assert.equal(job.location, "Calgary, AB");
});

test("why and background appear in the first kickoff segment of scenario 1", () => {
  const why = "I want to switch from nursing into data";
  const background = "ten years of retail store management";
  const out = generate({ targetRole: "Data Analyst", why, background, industry: "Retail" });
  const first = out.pack.scenarios[0].kickoff.segments[0].transcript;
  assert.ok(first.includes(why), "motivation should be referenced in the problem briefing");
  assert.ok(first.includes(background), "background should be referenced in the problem briefing");
  assert.ok(out.pack.career.description.includes(why), "motivation should shape the career description");
});

test("a request without why or background still produces a complete briefing", () => {
  const out = generate({ targetRole: "Data Analyst" });
  assert.equal(out.pack.scenarios[0].kickoff.segments[0].noteSection, "problem");
  assert.ok(words(out.pack.scenarios[0].kickoff.segments[0].transcript) >= 60);
});

test("level changes the difficulty ladder", () => {
  const difficulties = (level: string) => generate({ targetRole: "Data Analyst", level }).pack.scenarios.map((s) => s.difficulty);
  assert.deepEqual(difficulties("Intern"), ["beginner", "beginner", "intermediate"]);
  assert.deepEqual(difficulties("Mid-level"), ["beginner", "intermediate", "advanced"]);
  assert.deepEqual(difficulties("Senior"), ["intermediate", "advanced", "advanced"]);
  assert.deepEqual(difficulties("Lead"), ["intermediate", "advanced", "advanced"]);
});

test("a longer timeline gives longer scenarios", () => {
  const avg = (timeline: string) => {
    const s = generate({ targetRole: "Product Manager", timeline }).pack.scenarios;
    return s.reduce((sum, x) => sum + x.estMinutes, 0) / s.length;
  };
  assert.ok(avg("6 months") > avg("1 month"));
});

test("family and industry detection pick the right vocabulary", () => {
  assert.equal(detectFamily("Software Engineer"), "software");
  assert.equal(detectFamily("Machine Learning Engineer"), "ai_ml");
  assert.equal(detectFamily("Civil Engineer"), "energy_eng");
  assert.equal(detectFamily("UX Designer"), "design");
  assert.equal(detectFamily("Product Manager"), "product");
  assert.equal(detectFamily("Supply Chain Coordinator"), "operations");
  assert.equal(detectFamily("Game Designer"), "design");
  assert.equal(detectFamily("Game Producer"), "generic");
  assert.equal(detectFamily("Lawyer"), "generic");
  assert.equal(detectDomain("Healthcare").id, "healthcare");
  assert.equal(detectDomain("Energy and utilities").id, "energy");
  assert.equal(detectDomain("B2B SaaS").id, "saas");
  assert.equal(detectDomain(undefined).id, "generic");
});

test("the learn library has at least 24 topics with four-option checks", () => {
  assert.ok(LEARN_TOPICS.length >= 24, `only ${LEARN_TOPICS.length} topics`);
  for (const topic of LEARN_TOPICS) assert.equal(topic.wrong.length, 3, topic.key);
});

// ───────────────────────────── recommendations ─────────────────────────────

test("recommendTrainings returns 3 to 8 valid ids, mixing kinds where possible", () => {
  const ids = recommendTrainings({ targetRole: "Data Analyst", industry: "Retail" }, TRAININGS, ["SQL", "Dashboard design"]);
  assert.ok(ids.length >= 3 && ids.length <= 8, `got ${ids.length}`);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.ok(TRAININGS.some((t) => t.id === id), `${id} is not in the library`);
  assert.ok(ids.includes("tr-sql-analysis"), "the SQL training matches an analyst's skills");
  const kinds = new Set(ids.map((id) => TRAININGS.find((t) => t.id === id)?.kind));
  assert.ok(kinds.size >= 2, "a mix of training kinds");
});

test("recommendTrainings and generatePathPractice agree on the library", () => {
  for (const { request } of REQUESTS) {
    const out = generate(request);
    assert.ok(out.recommendedTrainingIds.length >= 3 && out.recommendedTrainingIds.length <= 8);
    for (const id of out.recommendedTrainingIds) assert.ok(TRAININGS.some((t) => t.id === id));
  }
  assert.deepEqual(recommendTrainings({ targetRole: "Lawyer" }, []), []);
});

// ───────────────────────────── sample for review ─────────────────────────────

test("prints a short sample for three roles", () => {
  const samples: PathRequest[] = [
    { targetRole: "Registered Nurse", level: "Senior", industry: "Healthcare", companyType: "Scale-up", location: "Toronto" },
    { targetRole: "Marketing Manager", industry: "Retail", timeline: "3 months" },
    { targetRole: "Civil Engineer", industry: "Utilities", location: "Edmonton, AB", companyType: "Enterprise" },
  ];
  for (const request of samples) {
    const out = generate(request);
    const scenario = out.pack.scenarios[0];
    console.log(`\n[${request.targetRole}] ${scenario.title}`);
    console.log(`  first transcript: ${scenario.kickoff.segments[0].transcript.slice(0, 320)}...`);
  }
});
