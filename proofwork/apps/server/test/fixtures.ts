// Small, self-contained content used by the core tests (never imports @pw/content).
import type {
  Career,
  Company,
  Job,
  KickoffSegment,
  Npc,
  PouQuestion,
  RubricAxis,
  Scenario,
  Slide,
  Stage,
  Training,
} from "@pw/shared";
import type { ContentSource } from "../src/core/content.ts";

export const CAREER_ID = "career-test";
export const COMPANY_ID = "co-test";
export const NPC_ID = "npc-test";
export const SCENARIO_ONE_ID = "scn-one";
export const SCENARIO_TWO_ID = "scn-two";
export const WORK_STAGE_ID = "stg-plan";
export const PRESENTATION_STAGE_ID = "stg-present";
export const TRAINING_ID = "tr-prompting";
export const JOB_ID = "job-junior";

const slide: Slide = { heading: "Context", bullets: ["Tickets arrive all day", "Routing is manual today"] };

function segment(id: string, title: string, noteSection: KickoffSegment["noteSection"]): KickoffSegment {
  return {
    id,
    title,
    noteSection,
    slides: [slide],
    transcript: "Here is the situation and what good looks like for this section of the project.",
    rubricPoints: ["State the core fact", "Name the risk", "Name the owner"],
    checkpointPrompt: `Write a short note about ${title.toLowerCase()}.`,
  };
}

function question(id: string): PouQuestion {
  return {
    id,
    prompt: `Walk me through how you would approach ${id}.`,
    rubricPoints: ["Names the approach", "Explains a trade-off"],
    followUp: `Can you be more specific about ${id}?`,
  };
}

const rubricHints: Record<RubricAxis, string> = {
  understanding: "Explains why the routing rules exist.",
  quality: "Rules are testable.",
  communication: "Summaries are short and clear.",
  independence: "Makes reasonable calls without asking.",
};

function workStage(): Stage {
  return {
    id: WORK_STAGE_ID,
    order: 1,
    title: "Plan the routing",
    summary: "Agree the routing rules.",
    estMinutes: 20,
    kind: "work",
    requirements: ["Route tickets by intent", "Log every decision"],
    planOpener: "Let's agree what routing should do first.",
    learn: [{ id: "li-routing", title: "Routing basics", minutes: 3, body: "Routing maps intents to queues." }],
    submission: { kinds: ["text", "file"], instructions: "Submit your routing plan." },
    rubricHints,
    xp: 300,
  };
}

function presentationStage(): Stage {
  return {
    id: PRESENTATION_STAGE_ID,
    order: 2,
    title: "Present to the team",
    summary: "Walk the team through the result.",
    estMinutes: 10,
    kind: "presentation",
    requirements: [],
    planOpener: "Show us what you built.",
    learn: [],
    submission: { kinds: ["recording"], instructions: "Record a short walkthrough." },
    rubricHints,
    xp: 200,
  };
}

function scenario(id: string, order: number, title: string, prefix: string): Scenario {
  return {
    id,
    careerId: CAREER_ID,
    companyId: COMPANY_ID,
    npcId: NPC_ID,
    order,
    title,
    coverWord: "ROUTE TICKETS",
    problemStatement: "Tickets are routed by hand and it is slow.",
    userRole: "AI engineer",
    projectType: "Agent",
    difficulty: "beginner",
    estMinutes: 30,
    maxXp: 1000,
    tools: ["Python"],
    workflows: ["Triage"],
    skills: ["Evaluation", "Prompting"],
    deliverables: [{ title: "Routing plan", description: "A written plan.", kind: "text" }],
    kickoff: {
      segments: [
        segment(`${prefix}-seg-1`, "The problem", "problem"),
        segment(`${prefix}-seg-2`, "The outcome", "outcome"),
        segment(`${prefix}-seg-3`, "The process", "process"),
      ],
    },
    pou: [question(`${prefix}-q1`), question(`${prefix}-q2`)],
    stages: [workStage(), presentationStage()],
    map: { x: 30, y: 40 },
  };
}

const careers: Career[] = [
  {
    id: CAREER_ID,
    title: "AI Engineer",
    tagline: "Build agents that do real work",
    description: "Test career.",
    skills: ["Evaluation", "Prompting"],
    color: "#7B6CF6",
  },
];

const companies: Company[] = [
  {
    id: COMPANY_ID,
    name: "Kettle Commerce",
    industry: "Retail",
    tagline: "A fictional retailer",
    color: "#2A9D8F",
    glyph: "KC",
    building: "tower",
  },
];

const npcs: Npc[] = [
  {
    id: NPC_ID,
    name: "Maya Ortiz",
    role: "Staff ML Engineer",
    companyId: COMPANY_ID,
    personality: "Direct and kind. Cares about clear reasoning.",
    voice: { rate: 1, pitch: 1 },
    avatarSeed: "maya",
  },
];

const trainings: Training[] = [
  {
    id: TRAINING_ID,
    kind: "skill",
    title: "Prompting basics",
    summary: "Write prompts that get reliable results.",
    minutes: 10,
    tags: ["prompting"],
    recommendedFor: [CAREER_ID],
    lessons: [
      { title: "Lesson one", body: "Be specific." },
      { title: "Lesson two", body: "Show examples." },
    ],
  },
];

const jobs: Job[] = [
  {
    id: JOB_ID,
    company: "Kettle Commerce",
    title: "Junior AI Engineer",
    location: "Remote",
    remote: true,
    salary: "$90k to $110k",
    careerId: CAREER_ID,
    minLevel: 0,
    description: "Ship agents for support teams.",
    requirements: ["Python"],
    autoApplicable: true,
    applyFields: [{ key: "fullName", label: "Full name", type: "text", required: true }],
  },
];

export const FIXTURE_CONTENT: ContentSource = {
  careers,
  companies,
  npcs,
  scenarios: [scenario(SCENARIO_ONE_ID, 1, "Ship a routing agent", "one"), scenario(SCENARIO_TWO_ID, 2, "Evaluate the agent", "two")],
  trainings,
  jobs,
};
