// Internal server contracts between the core (routes/DB, owned by src/core) and the AI layer (src/ai).
// The core constructs a ServerContext and hands it to the AI layer's socket handler.
import type {
  ChatMessage,
  CreditAction,
  Evaluation,
  FtuxTurn,
  FtuxView,
  Job,
  KickoffSegment,
  NoteVerdict,
  NotificationItem,
  Npc,
  Objective,
  Portfolio,
  PouQuestion,
  PresentationInput,
  Rubric,
  RubricLevel,
  Scenario,
  Stage,
  Submission,
  User,
  Company,
  Career,
  VisionBoard,
} from "@pw/shared";

export type ModelTier = "quality" | "fast";

/** Grading result before the core attaches id/createdAt/xp. */
export interface GradeResult {
  rubric: Rubric;
  overall: RubricLevel;
  summary: string;
  strengths: string[];
  improvements: string[];
  passed: boolean;
}

/** Server-side onboarding session state (persisted by the core as JSON). */
export interface FtuxSession {
  id: string;
  userId: string;
  view: FtuxView;
  /** Free-form memory the engine keeps between turns. */
  memory: Record<string, unknown>;
}

export interface AiEngine {
  /** "live" when Claude credentials are configured, otherwise deterministic "mock" (practice mode). */
  readonly mode: "live" | "mock";
  readonly models: { quality: string; fast: string };

  checkNote(i: { scenario: Scenario; segment: KickoffSegment; text: string; tier?: ModelTier }): Promise<Omit<NoteVerdict, "xp">>;

  answerKickoffQuestion(i: { scenario: Scenario; npc: Npc; company: Company; segment: KickoffSegment; question: string }): Promise<string>;

  /** Judge one spoken Proof-of-Understanding answer. */
  judgePou(i: {
    scenario: Scenario;
    npc: Npc;
    question: PouQuestion;
    transcript: string;
    /** True if this answer responds to the follow-up rather than the main prompt. */
    isFollowUp: boolean;
    notes: Objective["notes"];
  }): Promise<{ verdict: "pass" | "partial" | "fail"; reaction: string; covered: string[]; missing: string[] }>;

  /** One Plan-mode turn: manager negotiates requirements and an estimate. */
  planTurn(i: {
    scenario: Scenario;
    stage: Stage;
    npc: Npc;
    history: ChatMessage[];
    message: string;
    learnerName: string;
  }): Promise<{ reply: string; agreedRequirements: string[]; estimatedMinutes: number | null; isComplete: boolean; todos: string[] }>;

  /** Learn-mode tutor reply about this stage's topic. */
  learnChat(i: { scenario: Scenario; stage: Stage; history: ChatMessage[]; message: string }): Promise<string>;

  gradeSubmission(i: {
    scenario: Scenario;
    stage: Stage;
    submissions: Submission[];
    /** Text extracted from uploaded files when available (utf-8 text files only). */
    fileTexts: Record<string, string>;
    notes: Objective["notes"];
    signals: { planComplete: boolean; agreedRequirements: string[]; learnItemsCompleted: number; learnChats: number; managerQuestions: number; minutesSpent: number };
  }): Promise<GradeResult>;

  gradePresentation(i: { scenario: Scenario; stage: Stage; input: PresentationInput; priorEvaluations: Evaluation[] }): Promise<GradeResult>;

  /** Onboarding step machine. Must return the next view; never throws for user input. */
  ftuxTurn(i: { session: FtuxSession; turn: FtuxTurn; user: User; careers: Career[]; scenarios: Scenario[] }): Promise<{ view: FtuxView; memory: Record<string, unknown>; board: Partial<VisionBoard>; careerId?: string }>;
  ftuxStart(i: { sessionId: string; user: User }): FtuxView;

  coachReply(i: { user: User; history: ChatMessage[]; message: string; progressSummary: string }): Promise<string>;
  supportReply(i: { user: User; history: ChatMessage[]; message: string }): Promise<string>;
  draftApplication(i: { job: Job; user: User; portfolio: Portfolio }): Promise<{ answers: Record<string, string>; guessed: string[]; coverLetter: string }>;
  portfolioBio(i: { user: User; projects: Portfolio["projects"] }): Promise<{ headline: string; bio: string }>;

  /**
   * Co-worker turn (Do mode). Streams text deltas via onDelta and returns structured actions.
   * Screenshot is a data URL (jpeg/png) or undefined.
   */
  coworkTurn(i: {
    scenario: Scenario;
    stage: Stage;
    npc: Npc;
    learnerName: string;
    agreedRequirements: string[];
    todos: { id: string; text: string; done: boolean }[];
    history: ChatMessage[];
    input:
      | { kind: "text"; text: string }
      | { kind: "event"; event: string }
      | { kind: "im_lost"; question: string }
      | { kind: "highlight"; query: string }
      | { kind: "intro" };
    screenshot?: string;
    focusedApp?: string;
    windowTitle?: string;
    tier: ModelTier;
    onDelta: (delta: string) => void;
  }): Promise<{
    text: string;
    todos?: { id: string; text: string; done: boolean }[];
    highlight?: { rect: { x: number; y: number; w: number; h: number }; label: string };
    resource?: { title: string; body: string; url?: string };
    xp?: { amount: number; reason: string };
  }>;
}

/** Services the core exposes to the AI socket layer. */
export interface ServerContext {
  ai: AiEngine;
  verifyToken(token: string): Promise<{ userId: string } | null>;
  getUser(userId: string): User | null;
  getObjective(userId: string, objectiveId: string): Objective | null;
  saveObjective(userId: string, objective: Objective): void;
  /** Debits credits for an AI action. ok=false when the balance is insufficient (nothing debited). */
  debit(userId: string, action: CreditAction, reason?: string): { ok: boolean; balance: number | null };
  awardXp(userId: string, amount: number, reason: string, scenarioId: string | null, held?: boolean): void;
  notify(userId: string, item: Pick<NotificationItem, "category" | "title" | "body" | "link">): void;
  log(msg: string, extra?: Record<string, unknown>): void;
}
