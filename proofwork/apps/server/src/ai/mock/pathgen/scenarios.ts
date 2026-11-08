// Builds the three scenarios of a generated path: facts, kickoff briefings, Proof-of-Understanding questions and stages.
import type {
  Company,
  Deliverable,
  Difficulty,
  KickoffSegment,
  LearnItem,
  Npc,
  PouQuestion,
  RubricAxis,
  Scenario,
  Slide,
  Stage,
  SubmissionKind,
} from "@pw/shared";
import { RUBRIC_AXES } from "@pw/shared";
import { cultureLine, locationLine } from "./cast.ts";
import { pickLearnTopic, PHASE_FOR_ARCHETYPE, type LearnPhase } from "./learn.ts";
import type { Rng } from "./rng.ts";
import { SYSTEM_NAMES } from "./names.ts";
import type { Archetype, FamilyId, GenCtx, LevelBucket, MetricSpec, Profile } from "./types.ts";
import { cap, commas, fill, lowerFirst } from "./util.ts";

const ARCHETYPES: Archetype[] = ["diagnose", "build", "launch"];
const MAP = [
  { x: 20, y: 32 },
  { x: 40, y: 26 },
  { x: 58, y: 40 },
];
const DIFFICULTY: Record<LevelBucket, [Difficulty, Difficulty, Difficulty]> = {
  junior: ["beginner", "beginner", "intermediate"],
  mid: ["beginner", "intermediate", "advanced"],
  senior: ["intermediate", "advanced", "advanced"],
  default: ["beginner", "intermediate", "advanced"],
};
const PERIODS = ["the last two quarters", "the past eight weeks", "the last three months", "the spring release cycle"];
const DEADLINES = ["six weeks", "eight weeks", "five weeks", "the next quarter", "ten weeks"];
const TAIL_HOOKS = [
  "the way a process backs up when one step slows down",
  "the way small gaps in the data change a headline number",
  "the way one bad week can distort a trend",
  "the way a single complaint can hide a bigger pattern",
];

const COVER: Record<Archetype, string[]> = {
  diagnose: ["FIND THE CAUSE", "READ THE TREND", "CHASE THE GAP"],
  build: ["SHIP THE FIX", "BUILD THE CORE", "MAKE IT USABLE"],
  launch: ["ROLL IT OUT", "SCALE SAFELY", "GO WIDE"],
};

const TITLES: Record<Archetype, string[]> = {
  diagnose: ["Find why {metric} {worsened} at {company}", "Explain the {drop} in {metric} at {company}", "Find the cause of the {metric} {slide} at {company}"],
  build: ["Build a {buildArtifact} that {lifts} {metric} at {company}", "Design a {buildArtifact} for {customers} at {company}", "Improve {metric} for {customers} at {company}"],
  launch: ["Roll out the {buildArtifact} to every {customer} at {company}", "Take the {buildArtifact} from pilot to all {customers} at {company}", "Launch the {buildArtifact} safely across {company}"],
};

const PROBLEMS: Record<Archetype, string[]> = {
  diagnose: [
    "{company} has a problem with {metric}: it sits at {current} against a goal of {goal}, and the {team} team has not agreed on a cause. The {customers} generated about {volume} {items} over {period}, so the answer has to come from that data, not from anecdotes. Build {a:analysisArtifact} that isolates the cause, then recommend two or three fixes that can be tested within {deadline}.",
    "Leaders at {company} are arguing about {metric}, which sits at {current} against a goal of {goal}. Nobody has tested a theory, and the {customers} generated about {volume} {items} over {period} in the {system}. Produce {a:analysisArtifact}, find the cause with evidence, and propose fixes the {team} team can test within {deadline}.",
  ],
  build: [
    "{company} needs a {buildArtifact} that moves {metric} from {current} to {goal} for {customers}. Today the {team} team works around {problem}, and {volume} {items} pass through that path over {period}. Deliver a working {buildArtifact} within {deadline}, with the acceptance numbers written down before you start.",
  ],
  launch: [
    "The pilot of the {buildArtifact} moved {metric} from {current} to {pilot} for {customers} in one region. {company} wants it running for every {customer} within {deadline}, but {constraint}. Write the rollout plan, the risk list, the measurement plan and the weekly update that {stakeholder} needs in order to approve it.",
  ],
};

const SEG_TITLES: Record<Archetype, string[]> = {
  diagnose: ["What moved {metric}", "What a good answer looks like", "How I want you to work"],
  build: ["Where {metric} gets stuck", "What good looks like", "How I want you to work"],
  launch: ["The pilot and the ask", "What the rollout must include", "How I want you to run it"],
};

const QUOTES: Record<Archetype, string[]> = {
  diagnose: [
    "Show me {metric} split two ways before you tell me why it moved.",
    "If a pattern only shows up in our most engaged {customers}, it is a symptom, not a lever.",
    "A fix nobody can test is an opinion with a budget attached.",
  ],
  build: [
    "Write the acceptance numbers first. If we cannot say what good looks like, we will argue for a month.",
    "A rough {buildArtifact} that {customers} can use on day one beats a perfect spec nobody reads.",
    "Show me the {metric} number before you show me the screens.",
  ],
  launch: [
    "We do not scale on hope. Give me the stop rule before you give me the launch date.",
    "Every site that goes live is a new place where things can break, so plan for the worst one.",
    "{Stakeholder} will ask about the risk before the upside. Have both answers ready.",
  ],
};

const HINTS: Record<RubricAxis, string[]> = {
  understanding: [
    "Explains how {metric} is defined and why {focus} matters for the {goal} goal.",
    "Shows how {focus} connects to {metric}, with a number from the {system}.",
  ],
  quality: [
    "Every number traces back to the {system}, and every agreed requirement is visibly met.",
    "The work meets each requirement for {focus}, with evidence a reviewer can check.",
  ],
  communication: [
    "Writes short, plain sentences that {npcName} could repeat to {stakeholder}.",
    "Explains each number in terms {stakeholder} can act on, with the caveats stated.",
  ],
  independence: [
    "Makes the hardest call on {focus} without waiting for a hint, and records the assumption.",
    "Works through blockers on {focus} alone and asks only the questions that change the plan.",
  ],
};

interface StageSpec {
  title: string;
  summary: string;
  focus: string;
  phase: LearnPhase;
  reqs: string[];
  instructions: string;
}

const WORK_STAGES: Record<Archetype, StageSpec[]> = {
  diagnose: [
    {
      title: "Validate the {system} evidence",
      summary: "Confirm the {system} data is trustworthy before anyone discusses a cause.",
      focus: "the evidence",
      phase: PHASE_FOR_ARCHETYPE.diagnose[0],
      reqs: [
        "Deduplicate the {system} extract and report how many rows you removed",
        "Reproduce the {current} figure for {metric} from the raw data",
        "Report the share of {customers} whose outcome window is not yet complete",
        "Document every filter you apply to the {items} table",
      ],
      instructions:
        "Attach your validation queries and a short data quality log as a file. The log should be one table with columns for check, result and the action you took.",
    },
    {
      title: "Test the three explanations",
      summary: "Test each explanation against the data and drop any theory the numbers do not support.",
      focus: "the cause",
      phase: PHASE_FOR_ARCHETYPE.diagnose[1],
      reqs: [
        "Split {metric} by {segment1}, {segment2} and {segment3}",
        "Test each theory: {cause1}, {cause2} and {cause3}",
        "Compare like with like so heavy {customers} do not flatter any explanation",
        "Rank the causes by the strength of the evidence",
      ],
      instructions:
        "Share a link to your analysis workbook and a short text note that ranks the three theories, with the evidence behind each one.",
    },
    {
      title: "Recommend two or three fixes",
      summary: "Turn the strongest cause into changes the team can test within {deadline}.",
      focus: "the fix",
      phase: PHASE_FOR_ARCHETYPE.diagnose[2],
      reqs: [
        "Recommend two or three fixes that can be tested within {deadline}",
        "Estimate the change in {metric} needed to reach the {goal} goal",
        "State the caveat that {caveat}",
        "Name an owner and a test for each fix",
      ],
      instructions: "Upload the {memo} as a file, one page at most, with the fixes and the caveats up front.",
    },
  ],
  build: [
    {
      title: "Scope the {buildArtifact}",
      summary: "Agree what the first {buildArtifact} must do, and how it will be judged, before any build starts.",
      focus: "the scope",
      phase: PHASE_FOR_ARCHETYPE.build[0],
      reqs: [
        "Write acceptance criteria with a target of {goal} on {metric}",
        "Map the path that {volume} {items} take today",
        "Agree the smallest {buildArtifact} that can move the number",
        "Show how the design respects the rule that {constraint}",
      ],
      instructions: "Upload your acceptance criteria and a one-page scope as a file. Write every criterion as a yes or no check.",
    },
    {
      title: "Build the core {buildArtifact}",
      summary: "Build the main path end to end, and record every decision that affects {metric}.",
      focus: "the build",
      phase: PHASE_FOR_ARCHETYPE.build[1],
      reqs: [
        "Build a working {buildArtifact} for the main path from start to finish",
        "Log every decision that changes {metric}",
        "Keep the {system} integration inside the agreed interface",
        "Handle the failure case that a {customer} is most likely to hit",
      ],
      instructions: "Share a link to the working build or repository, plus a text note on the three riskiest decisions.",
    },
    {
      title: "Test with real {customers}",
      summary: "Put the build in front of real {customers}, and fix the top failures before handoff.",
      focus: "the test",
      phase: PHASE_FOR_ARCHETYPE.build[2],
      reqs: [
        "Test with at least ten {customers} and record {metric} against the {goal} goal",
        "Fix the top two failures before handoff",
        "Set {guardrail} as a guardrail before anything goes live",
        "Write up what changed between the first and second test",
      ],
      instructions: "Upload your test notes as a file with a results table: participant count, result and the change you made.",
    },
  ],
  launch: [
    {
      title: "Plan the rollout",
      summary: "Set the waves, the stop rules and the risks before anything goes live.",
      focus: "the rollout plan",
      phase: PHASE_FOR_ARCHETYPE.launch[0],
      reqs: [
        "Write rollout waves with a stop rule for each wave",
        "Confirm the {system} can carry {volume} {items} a month at peak",
        "List the three biggest risks with an early-warning signal for each",
        "Name the owner who can pause the rollout",
      ],
      instructions: "Upload the rollout plan as a file with one row per wave: scope, stop rule, owner and date.",
    },
    {
      title: "Prepare the {team} team",
      summary: "Get the runbook, the guardrail and the people ready before the first wave.",
      focus: "the preparation",
      phase: PHASE_FOR_ARCHETYPE.launch[1],
      reqs: [
        "Write the {system} runbook for the on-call team",
        "Set {guardrail} as the guardrail with a numeric limit",
        "Train the {team} staff who will support {customers} during the rollout",
        "Confirm the rollback steps work in staging",
      ],
      instructions: "Share a link to the runbook and a text note listing the guardrail limit and the owner for each step.",
    },
    {
      title: "Run the first wave",
      summary: "Launch to one site, watch the numbers every day, and apply the stop rule if needed.",
      focus: "the first wave",
      phase: PHASE_FOR_ARCHETYPE.launch[2],
      reqs: [
        "Run wave one on one site and report {metric} every day",
        "Trigger the stop rule if {guardrail} breaches its limit",
        "Write up what you changed after wave one and why",
        "Send {stakeholder} a weekly update with a clear ask",
      ],
      instructions: "Upload the wave one report as a file, with the daily {metric} values and the decisions you made.",
    },
  ],
};

/** Manager openers for Plan mode. {focus} and {metric} are filled per stage. */
const OPENERS = [
  "Before you start, let us agree the scope for this stage. I would focus on {focus}, with {metric} as the number we judge it by. Does that scope match what you expected, or would you cut anything first?",
  "Let's settle the scope before any work starts. For this stage the center of gravity is {focus}, and {metric} is the number we will judge it by. Would you change anything on that list, or does it match your plan?",
  "Here is how I see this stage: {focus} comes first, and {metric} tells us whether it worked. What would you cut or add before you begin?",
];

const PRESENT: Record<Archetype, { title: string; summary: string; reqs: string[]; instructions: string }> = {
  diagnose: {
    title: "Present the finding to {npcName}",
    summary: "Walk the manager through the finding in about five minutes, and answer their questions.",
    reqs: [
      "Present the {metric} finding and the gap from {current} to {goal} in under five minutes",
      "Name the top cause and the evidence behind it",
      "Answer one question about the caveats",
      "Propose the next step and an owner for each fix",
    ],
    instructions: "Record a walkthrough of four to six minutes for {npcName}, with one slide per decision.",
  },
  build: {
    title: "Demo the {buildArtifact} to {npcName}",
    summary: "Show the build and its result, then defend the trade-offs you made.",
    reqs: [
      "Demo the {buildArtifact} on the main {customer} path",
      "Show {metric} against the {goal} goal with the counts behind it",
      "Explain the trade-off you made to respect the rule that {constraint2}",
      "Hand off the {memo} and name an owner for the next release",
    ],
    instructions: "Record a demo of four to six minutes for {npcName}, with one slide per decision.",
  },
  launch: {
    title: "Present the rollout to {npcName}",
    summary: "Walk the manager through the plan and the first wave, and answer for the risks.",
    reqs: [
      "Present the rollout plan and the wave one results",
      "Name the stop rule and who is allowed to call it",
      "Explain how you handled the rule that {constraint}",
      "Give the next two waves a date within {deadline}",
    ],
    instructions: "Record a walkthrough of four to six minutes for {npcName}, with one slide per decision.",
  },
};

// ───────────────────────────── facts ─────────────────────────────

interface Facts {
  V: Record<string, string>;
  metric: MetricSpec;
  goal: number;
  current: number;
  pilot: number;
  segs: number[];
  pct: number;
}

/** The value after the slide: worse than the goal by 15 to 40 percent. */
function worsen(metric: MetricSpec, goal: number, rng: Rng): number {
  const x = rng.float(0.15, 0.4);
  let v = Math.round(metric.better === "lower" ? goal * (1 + x) : goal * (1 - x));
  if (v === goal) v = metric.better === "lower" ? goal + 1 : Math.max(0, goal - 1);
  return v;
}

/** Four shares that sum to 100, for a segment chart. */
function shares(rng: Rng): number[] {
  const weights = [0, 1, 2, 3].map(() => rng.int(10, 40));
  const total = weights.reduce((a, b) => a + b, 0);
  const out = weights.map((w) => Math.round((w / total) * 100));
  out[0] += 100 - out.reduce((a, b) => a + b, 0);
  return out;
}

function makeFacts(ctx: GenCtx, k: number, company: Company, npc: Npc): Facts {
  const { rng, prof } = ctx;
  const fam = prof.family;
  const dom = prof.domain;
  const metric = dom.metrics.length > 0 && (fam.id === "generic" || rng.chance(0.5)) ? rng.pick(dom.metrics) : rng.pick(fam.metrics);
  const goal = rng.int(metric.goal[0], metric.goal[1]);
  const current = worsen(metric, goal, rng);
  const pilot = Math.round(current + (goal - current) * rng.float(0.35, 0.6));
  const guard = rng.pick(fam.metrics.filter((x) => x.name !== metric.name));
  const guardGoal = rng.int(guard.goal[0], guard.goal[1]);
  const volume = Math.round(rng.int(dom.volume[0], dom.volume[1]) / 10) * 10;
  const causes = rng.shuffle(dom.causes);
  const segs = rng.sample(fam.segments, 3);
  const tools = rng.sample(fam.tools, 3);
  const workflows = rng.shuffle(fam.workflows);
  const constraints = rng.shuffle(fam.constraints);
  const system = `${rng.pick(SYSTEM_NAMES)} ${rng.pick(fam.systemNouns)}`;
  const V: Record<string, string> = {
    company: company.name,
    npc: npc.name.split(" ")[0],
    npcName: npc.name,
    npcRole: npc.role,
    team: fam.teams[k % fam.teams.length],
    system,
    metric: metric.name,
    // Direction words, so a lower-is-better metric (no-show rate, wait time) never "drops" as bad news.
    worsened: metric.better === "lower" ? "climbed" : "slipped",
    drop: metric.better === "lower" ? "rise" : "drop",
    slide: metric.better === "lower" ? "climb" : "slide",
    fell: metric.better === "lower" ? "rose" : "fell",
    lifts: metric.better === "lower" ? "cuts" : "lifts",
    lift: metric.better === "lower" ? "cut" : "lift",
    goal: metric.fmt(goal),
    current: metric.fmt(current),
    pilot: metric.fmt(pilot),
    guardrail: guard.name,
    guardGoal: guard.fmt(guardGoal),
    customers: dom.customers,
    customer: dom.customer,
    items: rng.pick(dom.items),
    volume: commas(volume),
    period: rng.pick(PERIODS),
    deadline: rng.pick(DEADLINES),
    constraint: constraints[0],
    constraint2: constraints[1],
    stakeholder: rng.pick(fam.stakeholders),
    tool1: tools[0],
    tool2: tools[1],
    tool3: tools[2],
    buildArtifact: fam.artifacts.build,
    analysisArtifact: fam.artifacts.analyze,
    memo: fam.artifacts.memo,
    segment1: segs[0],
    segment2: segs[1],
    segment3: segs[2],
    cause1: causes[0],
    cause2: causes[1],
    cause3: causes[2],
    caveat: dom.caveat,
    definition: dom.definition,
    problem: rng.pick(dom.problems),
    role: prof.role,
    roleLower: prof.roleLower,
    levelWord: prof.level.word,
    industry: prof.industry,
    workflow1: lowerFirst(workflows[0]),
    workflow2: lowerFirst(workflows[1]),
    workflow3: lowerFirst(workflows[2]),
  };
  const pct = metric.better === "lower" ? Math.round((goal / current) * 100) : Math.round((current / goal) * 100);
  return { V, metric, goal, current, pilot, segs: shares(rng), pct: Math.min(99, Math.max(1, pct)) };
}

/** A single sentence about the learner's background or motivation. Empty when neither was given. */
function tailorSentence(prof: Profile, rng: Rng): string {
  const bg = prof.background ? lowerFirst(prof.background) : undefined;
  const why = prof.why;
  if (bg && why) return fill("You mentioned you're coming from {bg}, and you told us why you are here: {why}.", { bg, why });
  if (bg) return fill("You mentioned you're coming from {bg}, so {hook} will feel familiar.", { bg, hook: rng.pick(TAIL_HOOKS) });
  if (why) return fill("You told us why you are here: {why}, so keep that goal in view as you work.", { why });
  return "";
}

// ───────────────────────────── kickoff ─────────────────────────────

function chartOf(facts: Facts, V: Record<string, string>): Slide {
  // Percent of goal falls from near the goal to where the metric is now.
  const start = Math.min(100, Math.max(facts.pct + 10, 95));
  const series = [0, 1, 2, 3].map((i) => Math.round(start + ((facts.pct - start) * i) / 3));
  return {
    heading: `Percent of goal for ${V.metric}, by month`,
    bullets: [`Nobody on the ${V.team} team agrees on the cause`, "Three theories are on the table and none has been tested"],
    visual: "chart",
    chart: series.map((value, i) => ({ label: `Month ${i + 1}`, value })),
  };
}

function segmentChart(facts: Facts, V: Record<string, string>, fam: string[]): Slide {
  return {
    heading: `Where the ${V.items} sit, by share`,
    bullets: [`Shares of ${V.volume} ${V.items} across the four ${V.customers} groups`, "The biggest share is where the work to test first should begin"],
    visual: "chart",
    chart: fam.map((label, i) => ({ label, value: facts.segs[i] })),
  };
}

function kickoffFor(arch: Archetype, ctx: GenCtx, scenarioId: string, facts: Facts, npc: Npc, company: Company, k: number): KickoffSegment[] {
  const { rng, prof } = ctx;
  const V = facts.V;
  const fam = prof.family;
  const f = (t: string) => fill(t, V);
  const quote = (text: string) => ({ text: f(text), author: `${npc.name}, ${npc.role}` });
  const culture = cultureLine(prof, rng);
  const location = locationLine(prof);
  const tail = k === 0 ? tailorSentence(prof, rng) : "";
  const seg = (n: number, title: string, noteSection: KickoffSegment["noteSection"], slides: Slide[], parts: string[], rubricPoints: string[], checkpointPrompt: string): KickoffSegment => ({
    id: `${scenarioId}-k${n}`,
    title: f(title),
    noteSection,
    slides,
    transcript: parts.filter(Boolean).map(f).join(" "),
    rubricPoints: rubricPoints.map(f),
    checkpointPrompt: f(checkpointPrompt),
  });
  const titles = SEG_TITLES[arch];
  const flowOf = (steps: string[]): Slide => ({
    heading: "The work order",
    bullets: steps.slice(0, 3).map((s) => cap(s)),
    visual: "flow",
    flow: steps.map(cap),
  });
  const workflowSteps = rng.sample(fam.workflows, 4).map((w) => f(w));

  if (arch === "diagnose") {
    const openers = ["Let's start with the number that keeps me up at night.", "Start with the number that worries me most.", "Here is the number I keep coming back to."];
    const k1 = seg(
      1,
      titles[0],
      "problem",
      [
        {
          heading: `${cap(V.metric)} is slipping`,
          bullets: [`${cap(V.metric)} is ${V.current} against a goal of ${V.goal}`, `The slide has run over ${V.period}`],
          visual: "metric",
          metric: { label: `${cap(V.metric)}, latest`, value: V.current },
        },
        chartOf(facts, V),
        { heading: "Three theories", bullets: [V.cause1, V.cause2, V.cause3].map(cap), visual: "none" },
      ],
      [
        `${rng.pick(openers)} {Metric} is {current} right now, against a goal of {goal}, and it has been sliding over {period}.`,
        "Nobody on the {team} team agrees on why. Some people blame {cause1}, others point at {cause2}, and a few keep coming back to {cause3}.",
        tail,
        "The {customers} generated about {volume} {items} over {period}, so this is not a small sample and it is not an anecdote.",
        "Be careful with the default dashboard, because {caveat}.",
        "I do not want you to pick a winner yet. I want numbers you can defend, and a clear answer about what actually separates the good outcomes from the bad ones.",
      ],
      [
        "States that {metric} is {current} against a goal of {goal}",
        "Names the three competing explanations: {cause1}, {cause2} and {cause3}",
        "Defines {metric} precisely enough to reproduce it from the {system}",
        "Handles this caveat explicitly: {caveat}",
      ],
      "In your own words, what is the {metric} problem, and what would make you confident about its cause?",
    );
    const k2 = seg(
      2,
      titles[1],
      "outcome",
      [
        flowOf([`Break ${V.metric} down`, "Rank the causes", `Write the ${V.memo}`, `Test within ${V.deadline}`]),
        { heading: "The decision threshold", bullets: [`Any fix must move ${V.metric} toward ${V.goal}`, "Report results with counts, not only rates"], visual: "metric", metric: { label: `Goal for ${V.metric}`, value: V.goal } },
      ],
      [
        "Here is what I need back from you. First, {a:analysisArtifact} that breaks {metric} down by {segment1}, {segment2} and {segment3}.",
        "Second, the causes ranked by how much evidence supports each one. Third, a short {memo} with two or three fixes the {team} team can test within {deadline}.",
        "Here is how I define the key term. {definition}.",
        "Keep in mind that {caveat}, and report those cases on their own line so nobody has to guess.",
        "{Stakeholder} will read the memo, so put the caveats up front and the recommendation second.",
        "The bar for success is {goal} on {metric}, and I need to see that the fix moves the number, not just the story.",
      ],
      [
        "Lists the three deliverables: the {analysisArtifact}, the ranked causes and the {memo}",
        "Defines the key term: {definition}",
        "Reports affected cases on their own line, not inside the headline number",
        "Sets a bar of {goal} for {metric} as the measure of success",
      ],
      "Summarize what the finished analysis must contain and how you will define the key term.",
    );
    const k3 = seg(
      3,
      titles[2],
      "process",
      [
        { heading: "Work order", bullets: workflowSteps.slice(0, 3), visual: "flow", flow: workflowSteps },
        { heading: "Know the traps", bullets: [`Respect the rule that ${V.constraint}`], visual: "quote", quote: quote(rng.pick(QUOTES.diagnose)) },
      ],
      [
        "Let me walk you through how I would like you to approach this.",
        "Work in this order: first {workflow1}, then {workflow2}, and finally {workflow3}.",
        "Use {tool1} and {tool2} for the heavy lifting, and do not build new infrastructure to answer one question.",
        "One real constraint to respect: {constraint}.",
        culture,
        "Keep notes on every filter and every assumption, because {stakeholder} will ask for them.",
        location,
      ],
      [
        "Sequences the work as {workflow1}, then {workflow2}, then {workflow3}",
        "Respects this constraint: {constraint}",
        "Keeps notes on every filter and assumption",
        "Uses {tool1} and {tool2} rather than new infrastructure",
      ],
      "Write down how you will check the data and what you will avoid before you run any numbers.",
    );
    return [k1, k2, k3];
  }

  if (arch === "build") {
    const k1 = seg(
      1,
      titles[0],
      "problem",
      [
        {
          heading: `${cap(V.metric)} is stuck`,
          bullets: [`${cap(V.metric)} is ${V.current} today`, `The goal is ${V.goal}`, `${V.volume} ${V.items} pass through this path over ${V.period}`],
          visual: "metric",
          metric: { label: `${cap(V.metric)}, today`, value: V.current },
        },
        segmentChart(facts, V, fam.segments),
        { heading: "The workaround", bullets: [`The ${V.team} team handles ${V.problem} by hand`, `Respect the rule that ${V.constraint}`], visual: "none" },
      ],
      [
        "Here is the problem in plain terms. {Metric} sits at {current} for {customers}, and the goal is {goal}.",
        "The {team} team keeps dealing with {problem}, and {volume} {items} pass through that path over {period}.",
        tail,
        "We tried a quick fix last month. It moved the number only a little, so we need a real {buildArtifact}.",
        "Today the workaround is a set of manual steps in the {system} that one person keeps running.",
        "We have one release window, so the scope has to fit inside it.",
        "Scope this as the smallest {buildArtifact} that can move the number, not everything we have ever wanted.",
      ],
      [
        "States that {metric} sits at {current} for {customers} against a goal of {goal}",
        "Notes that the workaround is manual steps that one person keeps running",
        "Scopes the work as the smallest {buildArtifact} that can move the number",
        "Names the problem: {problem}",
      ],
      "In your own words, what is broken today, and what would make the fix worth building?",
    );
    const k2 = seg(
      2,
      titles[1],
      "outcome",
      [
        flowOf([`Write acceptance criteria`, `Build the ${V.buildArtifact}`, `Test with real ${V.customers}`, `Hand off the ${V.memo}`]),
        { heading: "The acceptance bar", bullets: [`${V.goal} on ${V.metric}`, `Measured in the ${V.system} for two weeks`], visual: "metric", metric: { label: `Acceptance bar for ${V.metric}`, value: V.goal } },
      ],
      [
        "Here is what good looks like: a working {buildArtifact} that {team} staff can use on day one, plus a {memo} that explains the design choices.",
        "The acceptance bar is {goal} on {metric}, measured in the {system} for at least two weeks.",
        "We cannot break this: {constraint}. Design around it from the first sketch.",
        "Write the acceptance criteria before you build, and put them at the top of the {memo}.",
        "Count {customers} the same way the {system} does, so the numbers match what {stakeholder} sees.",
        "We are committed to a launch within {deadline}, so plan your days backward from that date.",
      ],
      [
        "Lists the deliverables: a working {buildArtifact}, acceptance criteria and the {memo}",
        "Sets a bar of {goal} for {metric}, measured for two weeks in the {system}",
        "Names the constraint: {constraint}",
        "Counts {customers} the same way the {system} does",
      ],
      "What would make the {buildArtifact} count as done, and what must it never break?",
    );
    const k3 = seg(
      3,
      titles[2],
      "process",
      [
        { heading: "Work order", bullets: workflowSteps.slice(0, 3), visual: "flow", flow: workflowSteps },
        { heading: "Know the risks", bullets: ["The happy path always looks fine", `Keep the ${V.tool1} and ${V.tool2} setup simple`], visual: "quote", quote: quote(rng.pick(QUOTES.build)) },
      ],
      [
        "Work in this order: {workflow1}, then {workflow2}, then {workflow3}.",
        "The first version will look fine on the happy path, so test with the {customer} most likely to get stuck.",
        "Use {tool1} and {tool2} that the team already runs, and avoid adding a new service for a single feature.",
        culture,
        location,
        "Keep a decision log, because {stakeholder} will ask why {metric} moved the way it did.",
      ],
      [
        "Sequences the work as {workflow1}, then {workflow2}, then {workflow3}",
        "Warns that the first version looks fine on the happy path",
        "Plans to use {tool1} and {tool2} rather than new infrastructure",
        "Keeps a decision log for why {metric} moved",
      ],
      "Describe how you will test before the full build, and what you will avoid along the way.",
    );
    return [k1, k2, k3];
  }

  // launch
  const k1 = seg(
    1,
    titles[0],
    "problem",
    [
      {
        heading: `The pilot moved ${V.metric}`,
        bullets: [`From ${V.current} to ${V.pilot} in one region`, `The goal is ${V.goal}`],
        visual: "metric",
        metric: { label: `${cap(V.metric)}, pilot`, value: V.pilot },
      },
      segmentChart(facts, V, fam.segments),
      { heading: "The risk ahead", bullets: [`${cap(V.constraint)}`, `The ${V.system} has never run at that size`], visual: "none" },
    ],
    [
      "The pilot worked. The {buildArtifact} moved {metric} from {current} to {pilot} for {customers} in one region.",
      "{Company} wants it live for every {customer} within {deadline}.",
      tail,
      "The catch is that {constraint}, and the {system} has never run at that size.",
      "At full scale that is about {volume} {items} a month, and the {team} team has to be ready for the peak.",
      "The rollout plan we sign off today sets the pace for the rest of the quarter.",
      "Our goal is {goal} on {metric}, and I will not accept a rollout that slips it.",
    ],
    [
      "States that the pilot moved {metric} from {current} to {pilot}",
      "Names the rollout target: every {customer} within {deadline}",
      "Names the constraint: {constraint}",
      "Notes the peak load of {volume} {items} a month at full scale",
    ],
    "In your own words, why did the pilot work, and what makes full scale risky?",
  );
  const k2 = seg(
    2,
    titles[1],
    "outcome",
    [
      flowOf(["One site", "Three sites", "Half the network", `All ${V.customers}`]),
      { heading: "The stop rule threshold", bullets: [`${V.guardrail} must stay within its limit`, "A breach pauses the next wave"], visual: "metric", metric: { label: `Limit for ${V.guardrail}`, value: V.guardGoal } },
    ],
    [
      "I want a rollout plan with waves, starting with one site and ending with every site.",
      "Each wave needs a stop rule, and the rule has to be written before that wave starts.",
      "Name the three biggest risks, and for each one say how you will see it early.",
      "Set a measurement plan that tracks {metric} against the {goal} goal, with {guardrail} as the guardrail.",
      "Draft the weekly update that {stakeholder} will receive during the rollout.",
      "Count everything the same way the {system} does, so the rollout numbers match the pilot.",
    ],
    [
      "Asks for waves with a stop rule written before each wave",
      "Names the three risks and an early signal for each",
      "Sets a measurement plan on {metric} against the {goal} goal",
      "Uses {guardrail} as the guardrail",
    ],
    "Summarize how the rollout will move from one site to all of them, and what would stop it.",
  );
  const k3 = seg(
    3,
    titles[2],
    "process",
    [
      { heading: "Work order", bullets: workflowSteps.slice(0, 3), visual: "flow", flow: workflowSteps },
      { heading: "Know the pushback", bullets: [`Watch for the rule that ${V.constraint}`], visual: "quote", quote: quote(rng.pick(QUOTES.launch)) },
    ],
    [
      "Here is how I want you to run it. Write the {system} runbook first, then train the {team} staff who will support it.",
      "Run wave one on a single site and report {metric} to me every day.",
      "Trigger the stop rule if {guardrail} breaches its limit, and do not wait for a meeting.",
      "Watch for the rule that {constraint}, because that is where I expect pushback.",
      culture,
      location,
    ],
    [
      "Writes the {system} runbook before training the {team} staff",
      "Triggers the stop rule if {guardrail} breaches its limit",
      "Watches for {constraint}",
      "Reports {metric} every day during wave one",
    ],
    "Write down the order you will run the rollout in, and the signal that tells you to stop.",
  );
  return [k1, k2, k3];
}

// ───────────────────────────── pou ─────────────────────────────

function pouFor(arch: Archetype, scenarioId: string, V: Record<string, string>): PouQuestion[] {
  const f = (t: string) => fill(t, V);
  const sets: Record<Archetype, [string, string[], string][]> = {
    diagnose: [
      [
        "How would you define {metric} so my team can reproduce the {current} figure, and what would you exclude?",
        ["Defines {metric} with a clear window and population", "Reproduces {current} from the {system} data", "Reports this separately: {caveat}"],
        "What changes in the headline number if you include those cases?",
      ],
      [
        "Which theory would you test first, {cause1} or {cause2}, and what result would change your mind?",
        ["Names {cause1} or {cause2} as the first test", "Describes a result that would rule the theory out", "Compares like with like so heavy {customers} do not flatter the result"],
        "How many weeks of data would you want before you trust that result?",
      ],
    ],
    build: [
      [
        "What acceptance numbers would you put in front of {stakeholder} before you start building?",
        ["Sets a target of {goal} for {metric}", "Names the {system} as the measurement source", "Mentions the rule that {constraint}"],
        "What would you cut first if the work has to land within {deadline}?",
      ],
      [
        "Why test a {buildArtifact} with real {customers} before a full build, and how many would you test with?",
        ["Tests with at least five {customers}", "Watches for the first point where a {customer} gets stuck", "Changes the design before the full build"],
        "What would you do if the first five {customers} all pass?",
      ],
    ],
    launch: [
      [
        "What is your stop rule for the rollout, and who is allowed to call it?",
        ["Sets a numeric limit on {guardrail} or {metric}", "Names one owner who can pause the rollout", "Says the stop rule is written before wave one"],
        "What happens to the {customer} already on the new {buildArtifact} when you pause?",
      ],
      [
        "How would you explain the risk that {constraint} to {stakeholder}?",
        ["States the risk plainly with the {volume} {items} exposure", "Gives a mitigation with an owner and a date", "Says what happens if the mitigation fails"],
        "What would you ask {stakeholder} to decide today?",
      ],
    ],
  };
  return sets[arch].map(([prompt, points, followUp], i) => ({
    id: `${scenarioId}-q${i + 1}`,
    prompt: f(prompt),
    rubricPoints: points.map(f),
    followUp: f(followUp),
  }));
}

// ───────────────────────────── stages ─────────────────────────────

function learnItemFor(rng: Rng, stageId: string, phase: LearnPhase, family: FamilyId, used: Set<string>, V: Record<string, string>): LearnItem {
  const topic = pickLearnTopic(rng, phase, family, used);
  const correctAt = rng.int(0, 3);
  const wrong = [...topic.wrong];
  const options = [...wrong.slice(0, correctAt), topic.correct, ...wrong.slice(correctAt)];
  return {
    id: `${stageId}-l1`,
    title: topic.title,
    minutes: rng.int(4, 7),
    body: fill(topic.body, V),
    check: { question: topic.question, options, answerIndex: correctAt, explanation: topic.explanation },
  };
}

function stagesFor(ctx: GenCtx, arch: Archetype, scenarioId: string, V: Record<string, string>, estTotal: number, usedTopics: Set<string>): Stage[] {
  const { rng, prof } = ctx;
  const softwareLike = prof.family.kinds.includes("github");
  const workKinds: SubmissionKind[][] = softwareLike
    ? [["github", "text"], ["github", "url"], ["url", "file"]]
    : [["file", "text"], ["url", "file"], ["url", "text"]];
  const weights = [0.25, 0.3, 0.25];
  const minutes = [...weights.map((s) => Math.max(10, Math.round((estTotal * s) / 5) * 5)), Math.max(10, Math.round((estTotal * 0.2) / 5) * 5)];
  const stages: Stage[] = [];
  const specs = WORK_STAGES[arch];
  specs.forEach((spec, i) => {
    const id = `${scenarioId}-s${i + 1}`;
    const sv = { ...V, focus: spec.focus };
    const f = (t: string) => fill(t, sv);
    stages.push({
      id,
      order: i + 1,
      title: f(spec.title),
      summary: f(spec.summary),
      estMinutes: minutes[i],
      kind: "work",
      requirements: spec.reqs.map(f),
      planOpener: f(rng.pick(OPENERS)),
      learn: [learnItemFor(rng, id, spec.phase, prof.family.id, usedTopics, sv)],
      submission: { kinds: workKinds[i], instructions: f(spec.instructions) },
      rubricHints: Object.fromEntries(
        RUBRIC_AXES.map((axis) => [axis, f(rng.pick(HINTS[axis]))]),
      ) as Stage["rubricHints"],
      xp: Math.round(rng.int(150, 250) / 5) * 5,
    });
  });
  const pres = PRESENT[arch];
  const presId = `${scenarioId}-s4`;
  const pv = { ...V, focus: "the presentation" };
  const pf = (t: string) => fill(t, pv);
  stages.push({
    id: presId,
    order: 4,
    title: pf(pres.title),
    summary: pf(pres.summary),
    estMinutes: minutes[3],
    kind: "presentation",
    requirements: pres.reqs.map(pf),
    planOpener: pf(
      "For the presentation I want a short story with one number and one next step. Does that match what you expect, or should we cut any part of it?",
    ),
    learn: [learnItemFor(rng, presId, "present", prof.family.id, usedTopics, pv)],
    submission: { kinds: ["recording", "file"], instructions: pf(pres.instructions) },
    rubricHints: Object.fromEntries(RUBRIC_AXES.map((axis) => [axis, pf(rng.pick(HINTS[axis]))])) as Stage["rubricHints"],
    xp: Math.round(rng.int(200, 300) / 5) * 5,
  });
  return stages;
}

// ───────────────────────────── scenario ─────────────────────────────

export function buildScenarios(ctx: GenCtx, companies: Company[], npcs: Npc[]): Scenario[] {
  const { rng, prof, idPrefix } = ctx;
  return ARCHETYPES.map((arch, k) => {
    const scenarioId = `${idPrefix}-s${k + 1}`;
    const facts = makeFacts(ctx, k, companies[k], npcs[k]);
    const V = facts.V;
    const f = (t: string) => fill(t, V);
    const estTotal = rng.int(prof.estMinutes[0], prof.estMinutes[1]);
    const usedTopics = new Set<string>();
    const stages = stagesFor(ctx, arch, scenarioId, V, estTotal, usedTopics);
    const stageXp = stages.reduce((sum, s) => sum + s.xp, 0);
    const artifactName = arch === "diagnose" ? V.analysisArtifact : V.buildArtifact;
    const deliverables: Deliverable[] = [
      {
        title: cap(`${artifactName} for ${V.metric}`),
        description: f(`A working {${arch === "diagnose" ? "analysisArtifact" : "buildArtifact"}} and the evidence behind it, measured against {goal} on {metric}.`),
        kind: prof.family.kinds[0],
      },
      {
        title: cap(V.memo),
        description: f("One page covering the decision, the numbers behind it and the caveat that {caveat}."),
        kind: "file",
      },
    ];
    const title = f(TITLES[arch][rng.int(0, TITLES[arch].length - 1)]);
    const userRole = `${V.levelWord ? `${V.levelWord} ` : ""}${prof.role} on the ${V.team} team`;
    const problemStatement = f(rng.pick(PROBLEMS[arch]));
    return {
      id: scenarioId,
      careerId: idPrefix,
      companyId: companies[k].id,
      npcId: npcs[k].id,
      order: k + 1,
      title,
      coverWord: rng.pick(COVER[arch]),
      problemStatement,
      userRole,
      projectType: f(arch === "diagnose" ? "Root-cause analysis of {metric}" : arch === "build" ? "Build a {buildArtifact}" : "Staged rollout of the {buildArtifact}"),
      difficulty: DIFFICULTY[prof.level.bucket][k],
      estMinutes: stages.reduce((sum, s) => sum + s.estMinutes, 0),
      maxXp: Math.round((stageXp + 550) / 5) * 5,
      tools: rng.sample(prof.family.tools, 4),
      workflows: rng.sample(prof.family.workflows, rng.int(3, 4)),
      skills: rng.sample(prof.family.skills, rng.int(4, 5)),
      deliverables,
      kickoff: { segments: kickoffFor(arch, ctx, scenarioId, facts, npcs[k], companies[k], k) },
      pou: pouFor(arch, scenarioId, V),
      stages,
      map: MAP[k],
    };
  });
}
