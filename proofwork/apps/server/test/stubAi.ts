// Deterministic AiEngine for tests. Judgement is keyed off simple phrases in the learner's text.
import {
  CUSTOM_CAREER_ID,
  type Career,
  type CareerPack,
  type Company,
  type FtuxStep,
  type FtuxView,
  type Job,
  type KickoffSegment,
  type Npc,
  type PathRequest,
  type RubricAxis,
  type RubricLevel,
  type Scenario,
  type Stage,
  type VisionBoard,
} from "@pw/shared";
import type { AiEngine, GeneratedPath, GeneratePathInput, GradeResult } from "../src/contracts.ts";

export interface GradeRecord {
  submissionCount: number;
  fileTexts: Record<string, string>;
  signals: { planComplete: boolean; learnItemsCompleted: number; managerQuestions: number };
}

export interface StubState {
  grades: GradeRecord[];
  presentations: number;
  /** Every request the stub generated a path for, oldest first. */
  pathRequests: PathRequest[];
  /** When > 0, the next N generated paths are deliberately invalid (one scenario missing). */
  brokenPaths: number;
}

const NEXT_STEP: Record<FtuxStep, FtuxStep> = {
  draw: "chat",
  chat: "recommend",
  recommend: "roadmap",
  roadmap: "why",
  why: "claim",
  claim: "done",
  done: "done",
};

function view(sessionId: string, step: FtuxStep, board: Partial<VisionBoard> = {}): FtuxView {
  return {
    sessionId,
    step,
    prompt: `Step: ${step}`,
    chips: [],
    messages: [],
    board,
    recommendations: [],
    roadmap: null,
    claim: null,
  };
}

function grade(level: RubricLevel, passed: boolean): GradeResult {
  const rationale = "Evidence in the work supports this.";
  return {
    rubric: {
      understanding: { level, rationale },
      quality: { level, rationale },
      communication: { level, rationale },
      independence: { level, rationale },
    },
    overall: level,
    summary: `Stub review: ${level}.`,
    strengths: ["Clear"],
    improvements: ["More tests"],
    passed,
  };
}

// ───────────────────────────── generated paths ─────────────────────────────

const RUBRIC_HINTS: Record<RubricAxis, string> = {
  understanding: "Explains the reasoning behind the work.",
  quality: "Work is testable and tidy.",
  communication: "Updates are short and clear.",
  independence: "Makes sensible calls without asking.",
};

/** Five sentences of 15 words each: inside the 60-220 word window the validator asks for. */
const TRANSCRIPT = Array.from({ length: 5 }, () => "Here is the situation and what good looks like for this part of the project.").join(" ");

const LEVELS = ["Associate", "Analyst", "Specialist", "Coordinator", "Lead"];

function segmentsFor(scenarioId: string): KickoffSegment[] {
  return (["problem", "outcome", "process"] as const).map((noteSection, i) => ({
    id: `${scenarioId}-seg-${i + 1}`,
    title: `${noteSection[0]?.toUpperCase()}${noteSection.slice(1)}`,
    noteSection,
    slides: [
      { heading: "Context", bullets: ["The team is stuck", "Work arrives every day"] },
      { heading: "Goal", bullets: ["Make the next step obvious", "Measure the result"] },
    ],
    transcript: TRANSCRIPT,
    rubricPoints: ["State the core fact", "Name the risk", "Name the owner"],
    checkpointPrompt: `Write a short note about the ${noteSection}.`,
  }));
}

function stagesFor(scenarioId: string): Stage[] {
  return [1, 2, 3].map((order): Stage => {
    const id = `${scenarioId}-st${order}`;
    const presentation = order === 3;
    return {
      id,
      order,
      title: presentation ? "Present the result" : `Work step ${order}`,
      summary: "A focused piece of the project.",
      estMinutes: 20,
      kind: presentation ? "presentation" : "work",
      requirements: ["Route the work by intent", "Log every decision", "Share the result"],
      planOpener: "Let's agree what this step needs.",
      learn: [{ id: `${id}-l1`, title: "Background", minutes: 3, body: "Background for this step." }],
      submission: presentation
        ? { kinds: ["recording"], instructions: "Record a short walkthrough." }
        : { kinds: ["text", "file"], instructions: "Submit the work." },
      rubricHints: RUBRIC_HINTS,
      xp: 200,
    };
  });
}

function scenarioFor(prefix: string, career: Career, order: number): Scenario {
  const id = `${prefix}-s${order}`;
  return {
    id,
    careerId: career.id,
    companyId: `${prefix}-c${order}`,
    npcId: `${prefix}-n${order}`,
    order,
    title: `Project ${order}: ${career.title} work`,
    coverWord: `PROJECT ${order}`,
    problemStatement: "The team needs help with a real problem this week.",
    userRole: career.title,
    projectType: "Project",
    difficulty: order === 1 ? "beginner" : order === 2 ? "intermediate" : "advanced",
    estMinutes: 30,
    maxXp: 900,
    tools: ["Spreadsheet"],
    workflows: ["Plan", "Build", "Present"],
    skills: career.skills,
    deliverables: [{ title: "Written plan", description: "A short plan.", kind: "text" }],
    kickoff: { segments: segmentsFor(id) },
    pou: [1, 2].map((k) => ({
      id: `${id}-q${k}`,
      prompt: `Walk me through question ${k} for this project.`,
      rubricPoints: ["Names the approach", "Explains a trade-off"],
      followUp: `Be more specific about question ${k}.`,
    })),
    stages: stagesFor(id),
    map: { x: 25 * order + 10, y: 40 },
  };
}

/** A small valid pack for a generated career: three scenarios, each with its own company and manager. */
export function buildGeneratedPack(idPrefix: string, request: PathRequest): CareerPack {
  const career: Career = {
    id: idPrefix,
    title: request.targetRole,
    tagline: "Built for you",
    description: `A path toward ${request.targetRole}.`,
    skills: ["Evaluation", "Prompting"],
    color: "#4C8BF5",
    generated: true,
  };
  const companyNames = ["Harbor Lane", "Brightwell Labs", "Northfield Works"];
  const companies: Company[] = companyNames.map((name, i) => ({
    id: `${idPrefix}-c${i + 1}`,
    name,
    industry: "Services",
    tagline: "A fictional company",
    color: "#2A9D8F",
    glyph: name.slice(0, 2).toUpperCase(),
    building: "loft",
  }));
  const npcs: Npc[] = companies.map((company, i) => ({
    id: `${idPrefix}-n${i + 1}`,
    name: `Manager ${i + 1}`,
    role: "Team lead",
    companyId: company.id,
    personality: "Friendly and specific. Wants clear reasoning.",
    voice: { rate: 1, pitch: 1 },
    avatarSeed: `${idPrefix}-${i}`,
  }));
  const scenarios = [1, 2, 3].map((order) => scenarioFor(idPrefix, career, order));
  return { career, companies, npcs, scenarios };
}

export function buildGeneratedJobs(idPrefix: string, pack: CareerPack): Job[] {
  return LEVELS.map((level, i) => ({
    id: `${idPrefix}-j${i + 1}`,
    company: pack.companies[i % pack.companies.length]?.name ?? "Harbor Lane",
    title: `${level} ${pack.career.title}`,
    location: "Remote",
    remote: true,
    salary: "$80k to $100k",
    careerId: pack.career.id,
    minLevel: 0,
    description: `Work as a ${level.toLowerCase()} ${pack.career.title}.`,
    requirements: ["Clear writing"],
    autoApplicable: true,
    applyFields: [
      { key: "full_name", label: "Full name", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "portfolio", label: "Portfolio link", type: "url", required: false },
      { key: "note", label: "Note", type: "textarea", required: false },
    ],
  }));
}

function generatedPath(input: GeneratePathInput, state: StubState): GeneratedPath {
  state.pathRequests.push(input.request);
  const pack = buildGeneratedPack(input.idPrefix, input.request);
  if (state.brokenPaths > 0) {
    state.brokenPaths -= 1;
    pack.scenarios = pack.scenarios.slice(0, 2);
  }
  return {
    pack,
    jobs: buildGeneratedJobs(input.idPrefix, pack),
    recommendedTrainingIds: input.trainings.slice(0, 2).map((t) => t.id),
    engine: "practice",
  };
}

// ───────────────────────────── engine ─────────────────────────────

export function createStubAi(): { ai: AiEngine; state: StubState } {
  const state: StubState = { grades: [], presentations: 0, pathRequests: [], brokenPaths: 0 };
  const ai: AiEngine = {
    mode: "mock",
    provider: "practice",
    models: { quality: "stub-quality", fast: "stub-fast" },
    async generatePath(input) {
      return generatedPath(input, state);
    },
    async checkNote({ text }) {
      const accepted = text.length >= 20;
      return { accepted, covered: accepted ? ["core fact"] : [], missing: accepted ? [] : ["detail"], feedback: accepted ? "Good note." : "Add detail." };
    },
    async answerKickoffQuestion({ question }) {
      return `Stub answer to: ${question}`;
    },
    async judgePou({ transcript, isFollowUp }) {
      const verdict = transcript.includes("vague") ? "partial" : transcript.includes("wrong") ? "fail" : "pass";
      return { verdict, reaction: `Manager reacts (${verdict}${isFollowUp ? ", follow-up" : ""}).`, covered: [], missing: [] };
    },
    async planTurn({ message }) {
      const isComplete = message.includes("agree");
      return {
        reply: isComplete ? "Agreed. Here are your todos." : "Tell me more about scope.",
        agreedRequirements: isComplete ? ["Route tickets by intent"] : [],
        estimatedMinutes: isComplete ? 45 : null,
        isComplete,
        todos: isComplete ? ["Draft the routing rules", "Test against samples"] : [],
      };
    },
    async learnChat({ message }) {
      return `Tutor says: ${message}`;
    },
    async gradeSubmission({ submissions, fileTexts, signals }) {
      state.grades.push({
        submissionCount: submissions.length,
        fileTexts,
        signals: { planComplete: signals.planComplete, learnItemsCompleted: signals.learnItemsCompleted, managerQuestions: signals.managerQuestions },
      });
      return grade("meeting", submissions.length > 0);
    },
    async gradePresentation() {
      state.presentations += 1;
      return grade("exceeding", true);
    },
    ftuxStart({ sessionId }) {
      return view(sessionId, "draw");
    },
    async ftuxTurn({ session, turn, scenarios, companies }: Parameters<AiEngine["ftuxTurn"]>[0]) {
      const careerId = turn.kind === "SELECT_CAREER" ? turn.careerId : undefined;
      const board: Partial<VisionBoard> = {
        ...session.view.board,
        ...(turn.kind === "MESSAGE" ? { targetRole: turn.text } : {}),
      };
      const step = NEXT_STEP[session.view.step];
      const next = view(session.id, step, board);
      if (step === "recommend") {
        next.recommendations = [
          {
            careerId: CUSTOM_CAREER_ID,
            title: board.targetRole ?? "Business Analyst",
            reason: "Built from your answers.",
            match: 92,
            kind: "custom",
            color: "#7B6CF6",
          },
        ];
      }
      if (step === "roadmap" && careerId) {
        next.roadmap = {
          careerId,
          scenarios: scenarios
            .filter((s) => s.careerId === careerId)
            .map((s) => ({
              scenarioId: s.id,
              title: s.title,
              company: companies.find((c) => c.id === s.companyId)?.name ?? "",
              estMinutes: s.estMinutes,
            })),
        };
      }
      return { view: next, memory: { turns: Object.keys(session.memory).length + 1 }, board, ...(careerId ? { careerId } : {}) };
    },
    async coachReply({ message }) {
      return `Coach: ${message}`;
    },
    async supportReply({ message }) {
      return `Support: ${message}`;
    },
    async draftApplication() {
      return { answers: { fullName: "Ada Lovelace" }, guessed: ["fullName"], coverLetter: "Dear hiring team." };
    },
    async portfolioBio() {
      return { headline: "Agent builder", bio: "Ships routing agents." };
    },
    async coworkTurn() {
      throw new Error("coworkTurn is not stubbed");
    },
  };
  return { ai, state };
}
