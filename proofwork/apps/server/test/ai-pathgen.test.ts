// Live path generation, offline: a fake LlmClient answers the outline and detail calls, so these tests cover
// assembly (ids, orders, XP, map), validation, the per-project retry and the fallback to practice.
import { test } from "node:test";
import assert from "node:assert/strict";
import { trainings, validateCareerPack, validateJobs } from "@pw/content";
import type { PathRequest, User } from "@pw/shared";
import type { GeneratePathInput } from "../src/contracts.ts";
import type { JsonOpts, LlmClient } from "../src/ai/llm.ts";
import { generatePathLive, PATH_TIMEOUT_MS } from "../src/ai/live/pathgen.ts";
import { createLiveEngine } from "../src/ai/live/index.ts";
import { generatePathPractice } from "../src/ai/mock/pathgen/index.ts";

const request: PathRequest = {
  targetRole: "Energy Analyst",
  level: "Mid-level",
  industry: "Energy",
  companyType: "Enterprise",
  location: "Calgary",
  timeline: "3 months",
  why: "I want to help the grid run on renewables",
  background: "Two years of forecasting in Excel at a regional utility",
};

const user = { id: "u1", name: "Ada Lovelace", email: "ada@example.com", vision: null } as unknown as User;
const input: GeneratePathInput = { request, user, idPrefix: "gen-test", trainings };

const SENTENCES = [
  "Our peak load reaches 4.2 gigawatts at six in the evening, and the forecast error target is three percent.",
  "I need you to explain where the forecast errors come from before we change the model.",
  "Two substations already run at ninety percent capacity, so small misses matter for the crew.",
  "Your note should cover the peak, the error target and the substation risk in your own words.",
  "Tell me what you would check first and why it matters to the team this quarter.",
];
const TRANSCRIPT = [...SENTENCES, ...SENTENCES].join(" ");
const BODY = Array.from({ length: 20 }, () => "Check the peak load against the forecast before you change anything.").join(" ");

function outline() {
  const scenario = (n: number) => ({
    title: `Project ${n} for Northwind Grid`,
    coverWord: `GRID LOAD ${n}`,
    problemStatement: "Forecasts miss the evening peak and the crew finds out too late.",
    userRole: "Energy analyst on the grid planning team",
    projectType: "Analysis",
    difficulty: ["beginner", "intermediate", "advanced"][n - 1],
    estMinutes: 90,
    tools: ["Python", "Grafana"],
    workflows: ["Triage"],
    skills: ["forecasting", "reporting"],
    deliverables: [
      { title: "Forecast model", description: "A model with the error by hour", kind: "github" },
      { title: "Summary note", description: "A one page brief for the crew", kind: "text" },
    ],
    keyFacts: [
      "Peak load is 4.2 GW at 6 pm",
      "Forecast error target is 3 percent",
      "Two substations are at 90 percent capacity",
      "The report is due in 10 working days",
    ],
  });
  return {
    career: {
      title: "Energy Analyst",
      tagline: "Turn grid data into plans the crew can use",
      description: "Analyses load and renewable output to plan the grid.",
      skills: ["forecasting", "grid operations", "python", "reporting", "stakeholder updates", "sql"],
      color: "#1fa67a",
    },
    companies: [
      { name: "Northwind Grid", industry: "Energy", tagline: "Power for the prairies", color: "#2f6fed", glyph: "NG", building: "tower" },
      { name: "Aurora Hydro", industry: "Energy", tagline: "Clean water power", color: "#e0572f", glyph: "AH", building: "tower" },
      { name: "Basin Wind", industry: "Energy", tagline: "Wind for the basin", color: "#7a4cf0", glyph: "bw", building: "dome" },
    ],
    npcs: [
      { name: "Maya Ortiz", role: "Senior Grid Analyst", personality: "Direct and calm. Checks every number twice. Likes a plan before a meeting." },
      { name: "Sam Okafor", role: "Lead Planner", personality: "Warm and quick. Asks what the crew needs first. Hates surprises." },
      { name: "Lena Brandt", role: "Forecast Manager", personality: "Precise and patient. Wants evidence in every claim. Explains her reasoning." },
    ],
    scenarios: [scenario(1), scenario(2), scenario(3)],
  };
}

function stage(k: number, presentation: boolean) {
  return {
    title: presentation ? "Present to the planning team" : `Work stage ${k}`,
    summary: "A focused part of the project with clear checks.",
    estMinutes: presentation ? 30 : 75,
    requirements: ["Explain the forecast error by hour", "Name the two substations at risk", "Share the summary note"],
    planOpener: "Let's agree the scope for this stage before anyone builds anything.",
    learn: [
      {
        title: "Checking a forecast",
        minutes: 5,
        body: BODY,
        check: { question: "What should you check first?", options: ["The colour scheme", "The peak load", "The menu"], answerIndex: 1, explanation: "The peak drives the risk." },
      },
    ],
    submission: { kinds: presentation ? ["recording", "text"] : ["text", "github"], instructions: "Share the work and a short note." },
    rubricHints: {
      understanding: "Explains the error in their own words.",
      quality: "Meets every agreed requirement.",
      communication: "Asks a clarifying question and explains the choices.",
      independence: "Finishes with few learn chats.",
    },
  };
}

function detailFor(n: number) {
  return {
    segments: ["problem", "outcome", "process"].map((name) => ({
      title: `${name[0].toUpperCase()}${name.slice(1)} of project ${n}`,
      slides: [
        { heading: "Context", bullets: ["The crew waits on the forecast", "Errors cluster at the peak"], visual: "none" },
        { heading: "Flow", bullets: ["Gather", "Check"], visual: "flow", flow: ["Gather the hourly load", "Compare to the forecast", "Explain the gap"] },
      ],
      transcript: TRANSCRIPT,
      rubricPoints: ["State the peak load", "Explain the forecast error", "Name the substation risk"],
      checkpointPrompt: `Write your note on the ${name} of project ${n}.`,
    })),
    pou: [
      { prompt: "How would you find the error source?", rubricPoints: ["Compare hourly load to forecast", "Name the biggest miss"], followUp: "Which hour would you look at first?" },
      { prompt: "What would you tell the crew?", rubricPoints: ["Say what changed", "Say what to do"], followUp: "What would you say in one sentence?" },
    ],
    stages: [stage(1, false), stage(2, false), stage(3, false), stage(4, true)],
  };
}

/** Which part of a project a detail call asks for: kickoff (+ PoU), stagesA (1-2) or stagesB (3-4). */
function briefPart(content: unknown): string {
  const m = String(content).match(/Brief \(part (\w+)\)/);
  return m ? m[1] : "kickoff";
}

function briefNumber(content: unknown): number {
  const m = String(content).match(/"number":(\d)/);
  return m ? Number(m[1]) : 1;
}

/** Scripted client. `badDetail(n, attempt)` returns true to send a detail that fails validation. */
const JOBS = [0, 1, 2, 2, 3].map((minLevel, n) => ({
  title: `${["Junior ", "", "", "Senior ", "Lead "][n]}Energy Analyst`,
  company: `Prairie Volt ${n + 1}`,
  location: "Calgary",
  remote: n % 2 === 0,
  salary: "$70,000 to $82,000 CAD",
  minLevel,
  description: "Forecast load for the grid team. You report to the head of system planning.",
  requirements: ["Forecasting in Python or Excel", "Clear written updates", "Comfort with hourly load data"],
}));

function fakeLlm(opts: { badDetail?: (n: number, attempt: number) => boolean; outlineFails?: boolean; jobsFail?: boolean } = {}) {
  const seen = { outline: 0, jobs: 0, detail: new Map<number, number>(), parts: new Map<string, number>(), timeouts: new Set<number | undefined>() };
  const client: LlmClient = {
    provider: "gemini",
    models: { quality: "q", fast: "f" },
    complete: async () => {
      throw new Error("not used");
    },
    stream: async () => {
      throw new Error("not used");
    },
    json: (async (o: JsonOpts<unknown>) => {
      seen.timeouts.add(o.timeoutMs);
      if (String(o.content).includes("<jobs_request>")) {
        seen.jobs++;
        if (opts.jobsFail) throw new Error("jobs unavailable");
        return o.validate(JSON.parse(JSON.stringify({ jobs: JOBS })));
      }
      if (String(o.content).includes("<brief>")) {
        const n = briefNumber(o.content);
        const part = briefPart(o.content);
        const full = detailFor(n);
        seen.parts.set(`${n}:${part}`, (seen.parts.get(`${n}:${part}`) ?? 0) + 1);
        if (part !== "kickoff") {
          const stages = part === "stagesA" ? full.stages.slice(0, 2) : full.stages.slice(2);
          return o.validate(JSON.parse(JSON.stringify({ stages })));
        }
        // seen.detail counts kickoff calls, the part a bad transcript breaks.
        const attempt = seen.detail.get(n) ?? 0;
        seen.detail.set(n, attempt + 1);
        if (opts.badDetail?.(n, attempt)) full.segments[0].transcript = "Too short to use.";
        return o.validate(JSON.parse(JSON.stringify({ segments: full.segments, pou: full.pou })));
      }
      seen.outline++;
      if (opts.outlineFails) throw new Error("outline unavailable");
      return o.validate(JSON.parse(JSON.stringify(outline())));
    }) as LlmClient["json"],
  };
  return { client, seen };
}

const practice = () => generatePathPractice(input);

test("live path: ids follow the idPrefix scheme, orders and XP are in range, and the pack validates", async () => {
  const { client, seen } = fakeLlm();
  const out = await generatePathLive(client, input, practice());
  assert.equal(out.engine, "live");
  assert.equal(seen.outline, 1);
  assert.deepEqual([...seen.timeouts], [PATH_TIMEOUT_MS], "every model call gets the path timeout");
  assert.equal(seen.parts.size, 9, "three parts for each of the three projects");

  const { pack } = out;
  assert.deepEqual(validateCareerPack(pack), []);
  assert.equal(pack.career.id, "gen-test");
  assert.equal(pack.career.generated, true);
  assert.deepEqual(pack.companies.map((c) => c.id), ["gen-test-c1", "gen-test-c2", "gen-test-c3"]);
  assert.deepEqual(pack.npcs.map((n) => n.id), ["gen-test-n1", "gen-test-n2", "gen-test-n3"]);
  assert.deepEqual(pack.companies.map((c) => c.building), ["tower", "campus", "dome"], "a repeated building is replaced by an unused one");
  assert.equal(pack.companies[2].glyph, "BW");
  assert.deepEqual(pack.scenarios.map((s) => s.id), ["gen-test-s1", "gen-test-s2", "gen-test-s3"]);
  assert.deepEqual(pack.scenarios.map((s) => s.order), [1, 2, 3]);
  assert.deepEqual(pack.scenarios.map((s) => s.map), [
    { x: 20, y: 32 },
    { x: 40, y: 26 },
    { x: 58, y: 40 },
  ]);

  for (const s of pack.scenarios) {
    assert.equal(s.careerId, "gen-test");
    assert.equal(s.kickoff.segments.map((k) => k.id).join(","), `${s.id}-k1,${s.id}-k2,${s.id}-k3`);
    assert.deepEqual(s.kickoff.segments.map((k) => k.noteSection), ["problem", "outcome", "process"]);
    assert.deepEqual(s.pou.map((q) => q.id), [`${s.id}-q1`, `${s.id}-q2`]);
    assert.deepEqual(s.stages.map((st) => st.id), [1, 2, 3, 4].map((k) => `${s.id}-s${k}`));
    assert.equal(s.stages[3].kind, "presentation");
    for (const st of s.stages.slice(0, 3)) assert.ok(st.xp >= 150 && st.xp <= 250, `work xp ${st.xp}`);
    assert.ok(s.stages[3].xp >= 200 && s.stages[3].xp <= 300, `presentation xp ${s.stages[3].xp}`);
    assert.equal(s.stages[0].learn[0].id, `${s.id}-s1-l1`);
    const sum = s.stages.reduce((a, st) => a + st.xp, 0);
    assert.equal(s.maxXp % 5, 0);
    assert.ok(s.maxXp >= sum + 547 && s.maxXp <= sum + 553, `maxXp ${s.maxXp} vs stage sum ${sum}`);
  }
  for (const n of pack.npcs) {
    assert.ok(n.voice.rate >= 0.95 && n.voice.rate <= 1.1);
    assert.ok(n.voice.pitch >= 0.9 && n.voice.pitch <= 1.15);
  }
  assert.deepEqual(out.jobs.map((j) => j.careerId), out.jobs.map(() => "gen-test"));
  assert.deepEqual(validateJobs(out.jobs, [pack.career.id]), []);
  assert.equal(seen.jobs, 1);
  assert.deepEqual(out.jobs.map((j) => j.id), [1, 2, 3, 4, 5].map((n) => `gen-test-j${n}`));
  assert.equal(out.jobs[0].company, "Prairie Volt 1", "the live postings are used");
  assert.equal(out.jobs[0].applyFields.find((f) => f.key === "motivation")?.label, "Why Prairie Volt 1?");
});

test("live path: a failed jobs call keeps the live path and uses the practice jobs", async () => {
  const { client } = fakeLlm({ jobsFail: true });
  const p = practice();
  const out = await generatePathLive(client, input, p);
  assert.equal(out.engine, "live");
  assert.deepEqual(out.jobs, p.jobs);
});

test("live path: a project whose detail fails validation is retried once and then succeeds", async () => {
  const { client, seen } = fakeLlm({ badDetail: (n, attempt) => n === 2 && attempt === 0 });
  const out = await generatePathLive(client, input, practice());
  assert.equal(out.engine, "live");
  assert.equal(seen.detail.get(2), 2, "the failing project was asked twice");
  assert.equal(seen.detail.get(1), 1);
  assert.equal(seen.parts.get("2:stagesA"), 1, "parts that succeeded are not asked again");
  assert.equal(seen.parts.get("2:stagesB"), 1);
  assert.deepEqual(validateCareerPack(out.pack), []);
});

test("live path: a project that fails twice fails the whole path, which then falls back to practice", async () => {
  const { client, seen } = fakeLlm({ badDetail: (n) => n === 3 });
  await assert.rejects(generatePathLive(client, input, practice()), /project 3 invalid|transcript too short/);
  assert.equal(seen.detail.get(3), 2);

  const engine = createLiveEngine(client);
  const result = await engine.generatePath(input);
  assert.equal(result.engine, "practice", "the whole result is the practice output, never a mix");
  assert.deepEqual(validateCareerPack(result.pack), []);
  assert.equal(engine.provider, "gemini");
  assert.equal(engine.mode, "live");
});

test("live path: an outline error falls back to practice for the whole result", async () => {
  const { client } = fakeLlm({ outlineFails: true });
  const result = await createLiveEngine(client).generatePath(input);
  assert.equal(result.engine, "practice");
  assert.equal(result.pack.career.id, "gen-test");
});
