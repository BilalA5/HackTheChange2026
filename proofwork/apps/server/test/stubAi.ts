// Deterministic AiEngine for tests. Judgement is keyed off simple phrases in the learner's text.
import type { AiEngine, FtuxSession, GradeResult } from "../src/contracts.ts";
import type { FtuxStep, FtuxTurn, FtuxView, RubricLevel } from "@pw/shared";

export interface GradeRecord {
  submissionCount: number;
  fileTexts: Record<string, string>;
  signals: { planComplete: boolean; learnItemsCompleted: number; managerQuestions: number };
}

export interface StubState {
  grades: GradeRecord[];
  presentations: number;
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

function view(sessionId: string, step: FtuxStep): FtuxView {
  return {
    sessionId,
    step,
    prompt: `Step: ${step}`,
    chips: [],
    messages: [],
    board: {},
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

export function createStubAi(): { ai: AiEngine; state: StubState } {
  const state: StubState = { grades: [], presentations: 0 };
  const ai: AiEngine = {
    mode: "mock",
    models: { quality: "stub-quality", fast: "stub-fast" },
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
    async ftuxTurn({ session, turn }: { session: FtuxSession; turn: FtuxTurn }) {
      const careerId = turn.kind === "SELECT_CAREER" ? turn.careerId : undefined;
      const board = turn.kind === "MESSAGE" ? { targetRole: turn.text } : {};
      const next = view(session.id, NEXT_STEP[session.view.step]);
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
