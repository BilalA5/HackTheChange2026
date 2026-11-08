// AI layer tests. Content is an inline fixture: this file never imports @pw/content.
import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import websocket from "@fastify/websocket";
import type {
  Career,
  Company,
  Evaluation,
  FtuxView,
  Job,
  KickoffSegment,
  Npc,
  Objective,
  Portfolio,
  PouQuestion,
  Scenario,
  Stage,
  User,
  VisionBoard,
} from "@pw/shared";
import { RUBRIC_AXES, RUBRIC_LEVELS } from "@pw/shared";
import type { AiEngine, FtuxSession, ServerContext } from "../src/contracts.ts";
import { createAiEngine, resolveModels, resolveProvider } from "../src/ai/index.ts";
import { registerCoworkSocket } from "../src/ai/cowork.ts";
import { coverage, keywordsOf, wordCount } from "../src/ai/text.ts";
import { overallOf } from "../src/ai/mock/grade.ts";
import { toTodo, extraRequirement } from "../src/ai/mock/plan.ts";

// ───────────────────────────── fixtures ─────────────────────────────

const company: Company = {
  id: "kettle",
  name: "Kettle Commerce",
  industry: "Retail software",
  tagline: "Shops that ship fast",
  color: "#2f6fed",
  glyph: "KC",
  building: "tower",
};

const npc: Npc = {
  id: "npc-priya",
  name: "Priya Shah",
  role: "Staff ML Engineer",
  companyId: "kettle",
  personality: "Direct and warm. Cares about clear plans and checking results.",
  voice: { rate: 1, pitch: 1 },
  avatarSeed: "priya",
};

const segment: KickoffSegment = {
  id: "seg-problem",
  title: "The problem",
  noteSection: "problem",
  slides: [{ heading: "Tickets pile up", bullets: ["Agents spend hours sorting tickets", "Queues are wrong one time in four"] }],
  transcript:
    "Our support queue is the bottleneck. Tickets land in the wrong place, agents spend hours sorting them by hand, and customers wait too long for a first reply. Your job is to fix the routing.",
  rubricPoints: [
    "Tickets are misrouted to the wrong queue",
    "Agents lose hours sorting by hand",
    "Customers wait too long for a first reply",
  ],
  checkpointPrompt: "Write what the problem is in your own words.",
};

const pou: PouQuestion = {
  id: "pou-1",
  prompt: "How would you design the routing agent, and how would you know it works?",
  rubricPoints: ["Routing is a classification problem", "Failed lookups need a fallback", "Every decision is logged for audit"],
  followUp: "Walk me through what happens when the lookup fails.",
};

const stage: Stage = {
  id: "stage-1",
  order: 1,
  title: "Build the router",
  summary: "Ship a first version of the routing agent.",
  estMinutes: 45,
  kind: "work",
  requirements: [
    "Classify each ticket into a routing queue",
    "Log every routing decision for audit",
    "Handle failed lookups with a retry and a fallback queue",
    "Write a short test for the happy path",
  ],
  planOpener: "Let's agree on the scope before anyone writes code.",
  learn: [
    {
      id: "learn-1",
      title: "Routing basics",
      minutes: 5,
      body: "Classify tickets by intent first. Keep the label set small and named. Log each routing decision with its inputs. Retry failed lookups once with backoff, then use the fallback queue. Test the happy path before the edge cases.",
    },
  ],
  submission: { kinds: ["text", "github"], instructions: "Share your repo link and a short write-up." },
  rubricHints: {
    understanding: "Explain why each requirement exists in your own words.",
    quality: "Meet every agreed requirement and link to the work.",
    communication: "Ask the manager at least one clarifying question and explain your choices.",
    independence: "Finish the stage with few learn chats.",
  },
  xp: 300,
};

const scenario: Scenario = {
  id: "scn-router",
  careerId: "ai-engineer",
  companyId: "kettle",
  npcId: "npc-priya",
  order: 1,
  title: "Ship a Ticket-Routing Agent for Kettle Commerce",
  coverWord: "ROUTE TICKETS",
  problemStatement: "Support tickets are routed by hand and often land in the wrong queue.",
  userRole: "AI engineer on the support platform team",
  projectType: "Agent",
  difficulty: "beginner",
  estMinutes: 120,
  maxXp: 1000,
  tools: ["Python", "Ticketing API"],
  workflows: ["Triage"],
  skills: ["classification", "logging"],
  deliverables: [{ title: "Routing agent", description: "A working agent that routes tickets", kind: "github" }],
  kickoff: { segments: [segment] },
  pou: [pou],
  stages: [stage],
  map: { x: 40, y: 50 },
};

const objective: Objective = {
  id: "obj-1",
  scenarioId: scenario.id,
  status: "in_progress",
  phase: "stages",
  startedAt: new Date().toISOString(),
  completedAt: null,
  timeSpentSec: 0,
  xpEarned: 0,
  xpHeld: 0,
  currentStageId: stage.id,
  performance: null,
  notes: { problem: "", outcome: "", process: "" },
  noteVerdicts: {},
  kickoffWatched: [],
  kickoffQuestions: [],
  pou: { status: "not_started", turns: [], questionIndex: 0, followUpAsked: false },
  stages: {},
};

const user: User = {
  id: "u1",
  email: "ada@example.com",
  name: "Ada Lovelace",
  createdAt: new Date().toISOString(),
  careerId: null,
  plan: "free",
  onboardingComplete: true,
  vision: null,
  settings: {
    launchAtLogin: false,
    menuBarStatus: false,
    theme: "system",
    sounds: { enabled: false, volume: 0.5 },
    notifications: {
      progress: true,
      feedback: true,
      manager: true,
      coaching: true,
      jobs: true,
      billing: true,
      product: true,
      osDelivery: false,
    },
    voice: { stt: "typed", ttsEnabled: false, ttsRate: 1, ttsNatural: false },
    aiModel: "fast",
    devices: {},
    privacy: { shareAnalytics: false, storeRecordings: false },
  },
};

const careers: Career[] = [
  { id: "ai-engineer", title: "AI Engineer", tagline: "Build LLM systems and agents", description: "", skills: ["python", "llm", "agents"], color: "#2f6fed" },
  { id: "product-manager", title: "Product Manager", tagline: "Shape products with data and users", description: "", skills: ["roadmaps", "research"], color: "#e0572f" },
  { id: "data-analyst", title: "Data Analyst", tagline: "Turn messy data into decisions", description: "", skills: ["sql", "dashboards"], color: "#1fa67a" },
];

const portfolio: Portfolio = {
  headline: "Ada builds routing agents",
  bio: "Ada has shipped one routing agent in simulation.",
  skills: ["python", "classification"],
  projects: [
    {
      scenarioId: scenario.id,
      title: "Ship a Ticket-Routing Agent",
      company: "Kettle Commerce",
      summary: "Routed tickets with a clear label set. Logged every decision and tested the happy path.",
      overall: "meeting",
      xp: 300,
      completedAt: new Date().toISOString(),
    },
  ],
  shareSlug: "ada-lovelace",
  unlocked: true,
};

// ───────────────────────────── engine: mock behaviour ─────────────────────────────

const mock = createAiEngine({ mode: "mock" });

test("provider resolution: explicit choice wins, then Gemini, then Anthropic, else practice", () => {
  assert.equal(resolveProvider({}, {}), "mock");
  assert.equal(resolveProvider({}, { GEMINI_API_KEY: "g" }), "gemini");
  assert.equal(resolveProvider({}, { ANTHROPIC_API_KEY: "a" }), "anthropic");
  assert.equal(resolveProvider({}, { ANTHROPIC_AUTH_TOKEN: "t" }), "anthropic");
  assert.equal(resolveProvider({}, { GEMINI_API_KEY: "g", ANTHROPIC_API_KEY: "a" }), "gemini");
  assert.equal(resolveProvider({}, { GEMINI_API_KEY: "g", PW_AI_PROVIDER: "anthropic" }), "anthropic");
  assert.equal(resolveProvider({}, { GEMINI_API_KEY: "g", PW_AI_PROVIDER: "mock" }), "mock");
  assert.equal(resolveProvider({}, { PW_AI_PROVIDER: "Gemini" }), "gemini");
  assert.equal(resolveProvider({}, { ANTHROPIC_API_KEY: "a", PW_AI_MODE: "mock" }), "mock");
  assert.equal(resolveProvider({ mode: "mock" }, { GEMINI_API_KEY: "g" }), "mock");
});

test("models: each provider has its own defaults and overrides", () => {
  assert.deepEqual(resolveModels("anthropic", {}), { quality: "claude-opus-5-5", fast: "claude-haiku-5-5" });
  assert.deepEqual(resolveModels("anthropic", { PW_MODEL_QUALITY: "q", PW_MODEL_FAST: "f" }), { quality: "q", fast: "f" });
  assert.deepEqual(resolveModels("gemini", {}), { quality: "gemini-3.8-flash", fast: "gemini-3.5-flash-lite" });
  assert.deepEqual(resolveModels("gemini", { PW_GEMINI_MODEL_QUALITY: "gq", PW_GEMINI_MODEL_FAST: "gf" }), { quality: "gq", fast: "gf" });
  assert.deepEqual(resolveModels("mock", {}), { quality: "practice", fast: "practice" });
  assert.equal(mock.mode, "mock");
  assert.equal(mock.provider, "practice");
});

test("text: stemming and coverage thresholds", () => {
  assert.ok(keywordsOf("Routing tickets").includes("rout"));
  const { covered, missing } = coverage("Tickets go to the wrong queue", [
    "Tickets are misrouted to the wrong queue",
    "Customers wait for replies",
  ]);
  assert.deepEqual(covered, ["Tickets are misrouted to the wrong queue"]);
  assert.deepEqual(missing, ["Customers wait for replies"]);
});

test("checkNote: a good note is accepted, a weak one is rejected with missing points", async () => {
  const good =
    "Tickets get misrouted to the wrong queue one time in four, so agents lose hours sorting by hand and customers wait too long for a first reply.";
  const ok = await mock.checkNote({ scenario, segment, text: good });
  assert.equal(ok.accepted, true);
  assert.equal(ok.missing.length, 0);
  assert.match(ok.feedback, /covers 3 of 3/);

  const weak = "Tickets end up in the wrong queue sometimes, and that is a real issue for the team today.";
  const bad = await mock.checkNote({ scenario, segment, text: weak });
  assert.equal(bad.accepted, false);
  assert.ok(bad.covered.length < 2);
  assert.ok(bad.missing.includes("Agents lose hours sorting by hand"));
  assert.ok(bad.missing.includes("Customers wait too long for a first reply"));
  assert.ok(bad.feedback.length > 0);

  const tooShort = await mock.checkNote({ scenario, segment, text: "Routing is slow." });
  assert.equal(tooShort.accepted, false);
});

test("judgePou: pass, partial and fail", async () => {
  const pass = await mock.judgePou({
    scenario,
    npc,
    question: pou,
    transcript:
      "Routing here is basically a classification problem: I would label each ticket by intent. When a lookup fails I retry and then fall back to a general queue. Every decision gets logged so we can audit it later.",
    isFollowUp: false,
    notes: objective.notes,
  });
  assert.equal(pass.verdict, "pass");
  assert.equal(pass.covered.length, 3);
  assert.ok(!pass.reaction.includes(pou.followUp));

  const partial = await mock.judgePou({
    scenario,
    npc,
    question: pou,
    transcript: "I think it's a classification problem, and I'd probably retry.",
    isFollowUp: false,
    notes: objective.notes,
  });
  assert.equal(partial.verdict, "partial");
  assert.ok(partial.missing.length > 0);
  assert.ok(!partial.reaction.includes(pou.followUp));

  const fail = await mock.judgePou({
    scenario,
    npc,
    question: pou,
    transcript: "I don't really know, sorry.",
    isFollowUp: false,
    notes: objective.notes,
  });
  assert.equal(fail.verdict, "fail");
});

test("planTurn: negotiation reaches isComplete on agreement, with todos", async () => {
  const first = await mock.planTurn({ scenario, stage, npc, history: [], message: "Hi, I'm ready to plan", learnerName: "Ada" });
  assert.equal(first.isComplete, false);
  assert.match(first.reply, /1\. /);
  assert.match(first.reply, /45 minutes/);
  assert.deepEqual(first.agreedRequirements, []);

  const history = [
    { id: "a", role: "npc" as const, text: first.reply, at: new Date().toISOString() },
    { id: "b", role: "learner" as const, text: "Sounds good, also add a dashboard for the team.", at: new Date().toISOString() },
  ];
  const done = await mock.planTurn({
    scenario,
    stage,
    npc,
    history: history.slice(0, 1),
    message: "Sounds good, also add a dashboard for the team.",
    learnerName: "Ada",
  });
  assert.equal(done.isComplete, true);
  assert.equal(done.estimatedMinutes, 45);
  assert.equal(done.agreedRequirements.length, stage.requirements.length + 1);
  assert.equal(done.agreedRequirements.at(-1), "A dashboard for the team");
  assert.equal(done.todos.length, done.agreedRequirements.length);
  assert.equal(done.todos[0], "Classify each ticket into a routing queue");
});

test("planTurn: a question is answered and agreement is still requested", async () => {
  const r = await mock.planTurn({
    scenario,
    stage,
    npc,
    history: [{ id: "a", role: "npc", text: "1. Something", at: new Date().toISOString() }],
    message: "What does the fallback queue mean?",
    learnerName: "Ada",
  });
  assert.equal(r.isComplete, false);
  assert.deepEqual(r.agreedRequirements, []);
  assert.match(r.reply, /work for you/);
});

test("extraRequirement and toTodo helpers", () => {
  assert.equal(extraRequirement("ok, add a retry limit"), "A retry limit");
  assert.equal(extraRequirement("sounds good"), null);
  assert.equal(toTodo("Handles failed lookups with a retry."), "Handle failed lookups with a retry");
});

test("learnChat answers from the stage material and nudges to try it", async () => {
  const reply = await mock.learnChat({ scenario, stage, history: [], message: "How should I retry failed lookups?" });
  assert.match(reply, /retry/i);
  assert.match(reply, /Try it/);
});

test("gradeSubmission: all four axes, sensible overall for strong and empty work", async () => {
  const strongText =
    "I built the router so each ticket is classified into a routing queue based on intent. Every routing decision is logged for audit, so the team can check it later. Failed lookups retry once and then fall back to a general queue. I wrote a short test that covers the happy path and it passes locally.";
  const strong = await mock.gradeSubmission({
    scenario,
    stage,
    submissions: [
      { id: "s1", kind: "github", value: "https://github.com/ada/router", createdAt: new Date().toISOString() },
      { id: "s2", kind: "text", value: strongText, createdAt: new Date().toISOString() },
    ],
    fileTexts: {},
    notes: {
      problem: "Tickets are misrouted, agents lose hours sorting by hand, customers wait too long for a first reply.",
      outcome: "Classify tickets into queues and log every decision for audit.",
      process: "Handle failed lookups with a retry and fallback queue, and test the happy path.",
    },
    signals: {
      planComplete: true,
      agreedRequirements: stage.requirements,
      learnItemsCompleted: 1,
      learnChats: 0,
      managerQuestions: 2,
      minutesSpent: 40,
    },
  });
  assert.deepEqual(Object.keys(strong.rubric).sort(), [...RUBRIC_AXES].sort());
  for (const axis of RUBRIC_AXES) {
    assert.ok((RUBRIC_LEVELS as readonly string[]).includes(strong.rubric[axis].level));
    assert.ok(strong.rubric[axis].rationale.length > 0);
  }
  assert.notEqual(strong.overall, "below");
  assert.equal(strong.passed, true);
  assert.ok(strong.strengths.length >= 2 && strong.strengths.length <= 3);
  assert.ok(strong.improvements.length >= 2 && strong.improvements.length <= 3);

  const empty = await mock.gradeSubmission({
    scenario,
    stage,
    submissions: [],
    fileTexts: {},
    notes: { problem: "", outcome: "", process: "" },
    signals: { planComplete: false, agreedRequirements: [], learnItemsCompleted: 0, learnChats: 0, managerQuestions: 0, minutesSpent: 2 },
  });
  assert.equal(empty.overall, "below");
  assert.equal(empty.passed, false);
});

test("overallOf: majority of four, ties resolve to meeting", () => {
  assert.equal(overallOf(["meeting", "meeting", "meeting", "below"]), "meeting");
  assert.equal(overallOf(["exceeding", "exceeding", "exceeding", "below"]), "exceeding");
  assert.equal(overallOf(["below", "below", "exceeding", "exceeding"]), "meeting");
});

test("gradePresentation returns the same shape", async () => {
  const evaluation: Evaluation = {
    id: "e1",
    rubric: {} as Evaluation["rubric"],
    overall: "meeting",
    summary: "",
    strengths: [],
    improvements: [],
    xp: 0,
    passed: true,
    createdAt: new Date().toISOString(),
  };
  const g = await mock.gradePresentation({
    scenario,
    stage,
    input: {
      transcript:
        "Here is the routing agent. Each ticket is classified into a queue, every decision is logged for audit, failed lookups fall back, and the happy path test passes. Next steps are monitoring and a review with the team.",
      durationSec: 200,
      framingScore: 0.8,
      slidesCovered: 4,
    },
    priorEvaluations: [evaluation],
  });
  assert.equal(g.passed, true);
  assert.equal(Object.keys(g.rubric).length, 4);
});

const genCareer: Career = {
  id: "g-u1-1",
  title: "Energy Analyst",
  tagline: "Analyse grid data for renewables",
  description: "",
  skills: ["energy", "grid", "forecasting"],
  color: "#1fa67a",
  generated: true,
};

const ftuxQuestions = ["targetRole", "level", "industry", "companyType", "location", "timeline"] as const;

test("ftux: six questions, then why, then recommend with the custom path first, then roadmap and claim", async () => {
  type Turn = Parameters<AiEngine["ftuxTurn"]>[0]["turn"];
  let session: FtuxSession = { id: "s1", userId: "u1", view: mock.ftuxStart({ sessionId: "s1", user }), memory: {} };
  const current = (): FtuxView => session.view;
  assert.equal(current().step, "draw");
  assert.equal(current().prompt, "Draw what your dream job looks like. Stick figures welcome.");
  assert.deepEqual(current().chips, []);
  assert.equal(current().roadmap, null);
  assert.equal(current().claim, null);

  const apply = async (turn: Turn, cs: Career[] = careers) => {
    const r = await mock.ftuxTurn({ session, turn, user, careers: cs, scenarios: [scenario], companies: [company] });
    session = { ...session, view: r.view, memory: r.memory };
    return r;
  };

  // Invalid for the draw step: unchanged view.
  const before = current();
  assert.equal((await apply({ kind: "MESSAGE", text: "hello" })).view, before);

  await apply({ kind: "DRAWN", dataUrl: "data:image/png;base64,iVBORw0KGgo=" });
  assert.equal(current().step, "chat");
  assert.equal(current().board.drawingDataUrl?.startsWith("data:image/png"), true);
  assert.equal(current().prompt, "What role are you aiming for? Type any job title.");
  assert.deepEqual(current().chips, ["Software Engineer", "Data Analyst", "Product Manager", "UX Designer", "Marketing Manager", "Not sure yet"]);

  // Invalid during chat: a WHY turn does nothing.
  const chatBefore = current();
  assert.equal((await apply({ kind: "WHY", text: "not yet" })).view, chatBefore);

  const values = ["AI Engineer", "Junior", "Tech", "Startup", "Remote", "3 months"];
  for (let k = 0; k < ftuxQuestions.length; k++) {
    assert.equal(current().step, "chat");
    await apply({ kind: "MESSAGE", text: values[k] });
    assert.equal(current().board[ftuxQuestions[k] as keyof VisionBoard], values[k]);
  }
  assert.equal(current().step, "why");
  assert.equal(current().prompt, "What's driving you, and what do you already bring? (studies, jobs, projects)");

  // Invalid during why: a SELECT_CAREER does nothing.
  const whyBefore = current();
  assert.equal((await apply({ kind: "SELECT_CAREER", careerId: "ai-engineer" })).view, whyBefore);

  await apply({ kind: "WHY", text: "I want to build agents that people rely on." });
  assert.equal(current().board.why, "I want to build agents that people rely on.");
  assert.equal(current().board.background, "I want to build agents that people rely on.");
  assert.equal(current().step, "recommend");

  const recs = current().recommendations;
  assert.equal(recs[0].careerId, "custom");
  assert.equal(recs[0].kind, "custom");
  assert.equal(recs[0].match, 100);
  assert.equal(recs[0].title, "AI Engineer");
  assert.equal(recs[0].color, "#7B6CF6");
  assert.equal(
    recs[0].reason,
    "Three projects written for you, from your answers: Junior · Tech · Startup · Remote · 3 months.",
  );
  assert.equal(recs[1]?.careerId, "ai-engineer");
  assert.equal(recs[1]?.kind, "authored");
  assert.equal(recs[1]?.color, "#2f6fed");
  assert.ok(recs.length <= 3);
  for (const r of recs) {
    assert.ok(r.match >= 0 && r.match <= 100);
    assert.ok(r.reason.length > 0);
  }

  // The custom id is not in the careers list until the core generates it: the view stays put.
  const pending = current();
  assert.equal((await apply({ kind: "SELECT_CAREER", careerId: "custom" })).view, pending);

  const sel = await apply({ kind: "SELECT_CAREER", careerId: "ai-engineer" });
  assert.equal(sel.careerId, "ai-engineer");
  assert.equal(current().step, "roadmap");
  const roadmap = current().roadmap;
  assert.ok(roadmap);
  assert.equal(roadmap.scenarios[0]?.scenarioId, scenario.id);
  assert.equal(roadmap.scenarios[0]?.company, "Kettle Commerce");

  await apply({ kind: "CONTINUE" });
  assert.equal(current().step, "claim");
  assert.deepEqual(current().claim, { credits: 10000, claimed: false });

  await apply({ kind: "CLAIM" });
  assert.equal(current().step, "done");
  assert.deepEqual(current().claim, { credits: 10000, claimed: true });

  const finalView = current();
  assert.equal((await apply({ kind: "CONTINUE" })).view, finalView);
});

test("ftux: a generated career is selectable but never recommended; Not sure yet gets an analyst path", async () => {
  let session: FtuxSession = { id: "s2", userId: "u1", view: mock.ftuxStart({ sessionId: "s2", user }), memory: {} };
  const cs = [...careers, genCareer];
  const apply = async (turn: Parameters<AiEngine["ftuxTurn"]>[0]["turn"]) => {
    const r = await mock.ftuxTurn({ session, turn, user, careers: cs, scenarios: [scenario], companies: [company] });
    session = { ...session, view: r.view, memory: r.memory };
    return r;
  };
  await apply({ kind: "DRAWN", dataUrl: "data:image/png;base64,iVBORw0KGgo=" });
  for (const text of ["Not sure yet", "Junior", "Energy", "Startup", "Remote", "3 months"]) await apply({ kind: "MESSAGE", text });
  await apply({ kind: "WHY", text: "I want to help the grid run on renewables." });

  const recs = session.view.recommendations;
  assert.equal(recs[0].careerId, "custom");
  assert.equal(recs[0].title, "Energy Business Analyst");
  assert.ok(!recs.some((r) => r.careerId === genCareer.id), "generated careers are never authored recommendations");

  const sel = await apply({ kind: "SELECT_CAREER", careerId: genCareer.id });
  assert.equal(sel.careerId, genCareer.id);
  assert.equal(session.view.step, "roadmap");
  assert.equal(session.view.roadmap?.careerId, genCareer.id);
  // No scenario for the generated career in this fixture, so the roadmap is empty but still valid.
  assert.deepEqual(session.view.roadmap?.scenarios, []);
});

test("draftApplication fills every required key and writes a cover letter", async () => {
  const job: Job = {
    id: "job-1",
    company: "Kettle Commerce",
    title: "Junior AI Engineer",
    location: "Remote",
    remote: true,
    salary: "Competitive",
    careerId: "ai-engineer",
    minLevel: 1,
    description: "Build routing agents for support.",
    requirements: ["Python", "Clear written plans"],
    autoApplicable: true,
    applyFields: [
      { key: "full_name", label: "Full name", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "portfolio_url", label: "Portfolio link", type: "url", required: true },
      { key: "level", label: "Level", type: "select", options: ["Junior", "Mid", "Senior"], required: true },
      { key: "why_interested", label: "Why this role?", type: "textarea", required: true },
      { key: "start_date", label: "Earliest start", type: "text", required: true },
    ],
  };
  const draft = await mock.draftApplication({ job, user, portfolio });
  for (const f of job.applyFields.filter((x) => x.required)) {
    assert.ok(draft.answers[f.key]?.trim(), `missing answer for ${f.key}`);
  }
  assert.equal(draft.answers.full_name, user.name);
  assert.equal(draft.answers.email, user.email);
  assert.equal(draft.answers.portfolio_url, "https://proofwork.app/p/ada-lovelace");
  assert.equal(draft.answers.level, "Junior");
  assert.ok(draft.guessed.includes("why_interested"));
  assert.ok(!draft.guessed.includes("full_name"));
  assert.ok(draft.answers.why_interested.includes("Ticket-Routing"));
  const words = wordCount(draft.coverLetter);
  assert.ok(words >= 100 && words <= 220, `cover letter length ${words}`);
});

test("portfolioBio returns a headline and a 2-3 sentence bio", async () => {
  const bio = await mock.portfolioBio({ user, projects: portfolio.projects });
  assert.ok(bio.headline.length > 0);
  const sentences = bio.bio.split(/(?<=[.!?])\s+/).filter(Boolean);
  assert.ok(sentences.length >= 2 && sentences.length <= 3);
});

test("coach and support replies are short and support mentions the human SLA", async () => {
  const coach = await mock.coachReply({ user, history: [], message: "I feel stuck", progressSummary: "" });
  assert.ok(coach.length > 0 && coach.length < 400);
  const support = await mock.supportReply({ user, history: [], message: "The page crashed" });
  assert.match(support, /human from the team reads every thread within one business day/);
});

test("mock cowork turns: intro sets todos, highlight returns a rect, im_lost gives 3 steps", async () => {
  const seen: string[] = [];
  const intro = await mock.coworkTurn({
    scenario,
    stage,
    npc,
    learnerName: "Ada",
    agreedRequirements: stage.requirements,
    todos: [],
    history: [],
    input: { kind: "intro" },
    tier: "fast",
    onDelta: (d) => seen.push(d),
  });
  assert.match(intro.text, /Ada/);
  assert.equal(intro.todos?.length, stage.requirements.length);
  assert.equal(seen.join(""), intro.text);

  const hi = await mock.coworkTurn({
    scenario, stage, npc, learnerName: "Ada", agreedRequirements: [], todos: [], history: [],
    input: { kind: "highlight", query: "the queue config" }, tier: "fast", onDelta: () => {},
  });
  assert.deepEqual(hi.highlight?.rect, { x: 0.35, y: 0.3, w: 0.3, h: 0.2 });

  const lost = await mock.coworkTurn({
    scenario, stage, npc, learnerName: "Ada", agreedRequirements: [], todos: [], history: [],
    input: { kind: "im_lost", question: "where do I start?" }, tier: "fast", onDelta: () => {},
  });
  assert.equal((lost.text.match(/^\d\. /gm) ?? []).length, 3);
});

// ───────────────────────────── /ws/cowork ─────────────────────────────

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Harness {
  app: ReturnType<typeof Fastify>;
  /** Shared, mutable counters (read after the socket has done its work). */
  calls: { coworkTurn: number; debits: number };
  store: Map<string, Objective>;
}

async function harness(): Promise<Harness> {
  const calls = { coworkTurn: 0, debits: 0 };
  const inner = createAiEngine({ mode: "mock" });
  const ai: AiEngine = {
    ...inner,
    coworkTurn: async (i) => {
      calls.coworkTurn++;
      return inner.coworkTurn(i);
    },
  };
  const store = new Map<string, Objective>([[objective.id, structuredClone(objective)]]);

  const ctx: ServerContext = {
    ai,
    verifyToken: async (token) => (token === "good-token" ? { userId: "u1" } : null),
    getUser: () => user,
    resolveScenario: (_uid, scenarioId) => (scenarioId === scenario.id ? { scenario, company, npc } : null),
    getObjective: (_uid, id) => store.get(id) ?? null,
    saveObjective: (_uid, o) => {
      store.set(o.id, o);
    },
    debit: () => {
      calls.debits++;
      return { ok: true, balance: 10000 - calls.debits * 10 };
    },
    awardXp: () => {},
    notify: () => {},
    log: () => {},
  };

  const app = Fastify();
  await app.register(websocket);
  registerCoworkSocket(app, ctx);
  await app.ready();
  return { app, calls, store };
}

type Frame = Record<string, unknown> & { type?: string };

function recorder(ws: { on: (e: string, fn: (...a: any[]) => void) => unknown }) {
  const frames: Frame[] = [];
  ws.on("message", (data: unknown) => frames.push(JSON.parse(String(data)) as Frame));
  return frames;
}

async function until(pred: () => boolean, ms = 8000): Promise<void> {
  const t0 = Date.now();
  while (!pred()) {
    if (Date.now() - t0 > ms) throw new Error("timed out waiting for socket frames");
    await sleep(15);
  }
}

const has = (frames: Frame[], type: string) => frames.some((f) => f.type === type);

test("cowork: auth, init streams the intro, and every event_key is acked", { timeout: 20000 }, async () => {
  const h = await harness();
  try {
    const ws = await h.app.injectWS("/ws/cowork");
    const frames = recorder(ws);
    ws.send(JSON.stringify({ action: "auth", token: "good-token", session_id: "sess-1", device_id: "dev-1" }));
    await until(() => has(frames, "connection_registered"));
    assert.deepEqual(frames[0], { type: "connection_registered", session_id: "sess-1" });

    ws.send(
      JSON.stringify({
        action: "init",
        event_key: "k-init",
        objectiveId: objective.id,
        stageId: stage.id,
        mode: "do",
        learnerName: "Ada",
      }),
    );
    await until(() => has(frames, "text_response"));

    assert.ok(frames.some((f) => f.type === "ack" && f.event_key === "k-init"));
    const ready = frames.find((f) => f.type === "session_ready");
    assert.equal(ready?.npcName, npc.name);
    assert.equal(ready?.budgetMinutes, 20);
    assert.equal(ready?.mode, "do");
    assert.ok(has(frames, "thinking"));
    const deltas = frames.filter((f) => f.type === "text_delta");
    assert.ok(deltas.length > 1, "intro should stream several deltas");
    const response = frames.find((f) => f.type === "text_response") as { turn_id: string; text: string };
    assert.equal(deltas.map((d) => d.delta).join(""), response.text);
    assert.ok(deltas.every((d) => d.turn_id === response.turn_id));
    assert.ok(has(frames, "todos"), "intro sets todos from the requirements");

    ws.send(JSON.stringify({ action: "ping" }));
    await until(() => has(frames, "pong"));

    ws.send(JSON.stringify({ action: "user_text", event_key: "k-text-1", text: "What is a routing queue?" }));
    await until(() => frames.some((f) => f.type === "text_response" && f.turn_id !== response.turn_id));
    assert.ok(frames.some((f) => f.type === "ack" && f.event_key === "k-text-1"));
    assert.ok(frames.some((f) => f.type === "credits"));

    ws.close();
  } finally {
    await h.app.close();
  }
});

test("cowork: a replayed event_key is acked but processed only once", { timeout: 20000 }, async () => {
  const h = await harness();
  try {
    const ws = await h.app.injectWS("/ws/cowork");
    const frames = recorder(ws);
    ws.send(JSON.stringify({ action: "auth", token: "good-token", session_id: "sess-2", device_id: "dev-1" }));
    await until(() => has(frames, "connection_registered"));
    ws.send(JSON.stringify({ action: "init", event_key: "k-init-2", objectiveId: objective.id, stageId: stage.id, mode: "do", learnerName: "Ada" }));
    await until(() => has(frames, "text_response"));
    const baseline = h.calls.coworkTurn;

    const replayed = { action: "user_text", event_key: "dup-key", text: "Help me with the queue" };
    ws.send(JSON.stringify(replayed));
    ws.send(JSON.stringify(replayed));
    await until(() => frames.filter((f) => f.type === "ack" && f.event_key === "dup-key").length === 2);
    await until(() => h.calls.coworkTurn > baseline);
    await sleep(300);

    assert.equal(h.calls.coworkTurn - baseline, 1, "the duplicate must not reach the engine");
    assert.equal(h.calls.debits, 1, "the duplicate must not be debited");
    ws.close();
  } finally {
    await h.app.close();
  }
});

test("cowork: an unauthorized first frame is refused and the socket closes with 4401", { timeout: 20000 }, async () => {
  const h = await harness();
  try {
    const ws = await h.app.injectWS("/ws/cowork");
    const frames = recorder(ws);
    const closed = new Promise<number>((resolve) => ws.on("close", (code: number) => resolve(code)));
    ws.send(JSON.stringify({ action: "auth", token: "wrong", session_id: "sess-3", device_id: "dev-1" }));
    const code = await Promise.race([closed, sleep(5000).then(() => -1)]);
    assert.equal(code, 4401);
    assert.ok(frames.some((f) => f.type === "error" && f.code === "unauthorized"));
    assert.ok(!has(frames, "connection_registered"));
  } finally {
    await h.app.close();
  }
});

test("cowork: a non-auth first frame is refused and the socket closes with 4401", { timeout: 20000 }, async () => {
  const h = await harness();
  try {
    const ws = await h.app.injectWS("/ws/cowork");
    const frames = recorder(ws);
    const closed = new Promise<number>((resolve) => ws.on("close", (code: number) => resolve(code)));
    ws.send(JSON.stringify({ action: "ping" }));
    const code = await Promise.race([closed, sleep(5000).then(() => -1)]);
    assert.equal(code, 4401);
    assert.ok(frames.some((f) => f.type === "error" && f.code === "unauthorized"));
  } finally {
    await h.app.close();
  }
});
