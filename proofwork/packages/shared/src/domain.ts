// Domain model shared by server, desktop and renderer. Content (authored) types first, learner state second.
import type {
  CreditCategory,
  NotificationCategory,
  PlanId,
  RubricAxis,
  RubricLevel,
} from "./constants.ts";

export type Id = string;
/** ISO-8601 timestamp string. */
export type IsoDate = string;

// ───────────────────────────── Authored content ─────────────────────────────

export interface Career {
  id: Id; // e.g. "ai-engineer", or "g-<user>-<n>" for a generated path
  title: string; // "AI Engineer"
  tagline: string;
  description: string;
  skills: string[];
  /** Accent colour (hex) used for this career's cards. */
  color: string;
  /** True for a path generated for one learner (not part of the authored library). */
  generated?: boolean;
}

/** Fictional companies only — never real brands. */
export interface Company {
  id: Id;
  name: string;
  industry: string;
  tagline: string;
  /** Brand colour (hex) used for the building on the world map and card art. */
  color: string;
  /** 1–2 character monogram shown on the building and timeline node. */
  glyph: string;
  /** Building silhouette on the world map. */
  building: "tower" | "campus" | "dome" | "loft" | "hangar" | "spire";
}

export interface NpcVoice {
  /** Web Speech API voice name preference (best effort), rate 0.5–2, pitch 0–2. */
  voiceName?: string;
  rate: number;
  pitch: number;
  /** Which family of natural (model) voices the character speaks with. Unset: chosen from the avatar seed. */
  style?: "feminine" | "masculine";
}

/** AI manager / teammate character. */
export interface Npc {
  id: Id;
  name: string;
  role: string; // "Staff ML Engineer"
  companyId: Id;
  /** 2–3 sentences: how they talk, what they care about. Fed into prompts. */
  personality: string;
  voice: NpcVoice;
  /** Seed for the generated avatar (initials + gradient). */
  avatarSeed: string;
}

export type NoteSection = "problem" | "outcome" | "process";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type SubmissionKind = "text" | "url" | "github" | "file" | "recording";

export interface Slide {
  heading: string;
  bullets: string[];
  /** Optional visual treatment rendered by the kickoff player. */
  visual?: "metric" | "quote" | "flow" | "chart" | "none";
  metric?: { label: string; value: string };
  quote?: { text: string; author: string };
  /** Steps for a "flow" visual. */
  flow?: string[];
  /** Bars for a "chart" visual (values 0–100). */
  chart?: { label: string; value: number }[];
}

export interface KickoffSegment {
  id: Id;
  title: string;
  noteSection: NoteSection;
  slides: Slide[];
  /** What the manager says during this segment (spoken via TTS, shown as captions). 80–160 words. */
  transcript: string;
  /** Points a good note for this section must cover. Used by the note checker. 3–5 items. */
  rubricPoints: string[];
  /** Prompt shown after the segment, nudging the learner to write their note. */
  checkpointPrompt: string;
}

export interface PouQuestion {
  id: Id;
  /** What the manager asks, spoken. */
  prompt: string;
  /** What a passing spoken answer must show understanding of (2–4 items). */
  rubricPoints: string[];
  /** Follow-up the manager asks if the first answer is partial. */
  followUp: string;
}

export interface LearnItem {
  id: Id;
  title: string;
  minutes: number;
  /** Markdown body (150–300 words), practical and specific to the stage. */
  body: string;
  check?: { question: string; options: string[]; answerIndex: number; explanation: string };
}

export interface Stage {
  id: Id;
  order: number;
  title: string;
  summary: string;
  estMinutes: number;
  kind: "work" | "presentation";
  /** Requirements the learner and manager should agree on in Plan mode. */
  requirements: string[];
  /** Opening message from the manager in Plan mode. */
  planOpener: string;
  /** Micro-trainings for Learn mode (1–3). */
  learn: LearnItem[];
  submission: { kinds: SubmissionKind[]; instructions: string };
  /** What "meeting expectations" looks like on each axis for this stage. */
  rubricHints: Record<RubricAxis, string>;
  xp: number;
}

export interface Deliverable {
  title: string;
  description: string;
  kind: SubmissionKind;
}

export interface Scenario {
  id: Id;
  careerId: Id;
  companyId: Id;
  npcId: Id;
  /** 1-based order inside its career; scenario n+1 unlocks after n is complete. */
  order: number;
  title: string; // "Ship a Ticket-Routing Agent for Kettle Commerce"
  /** Short punchy label for card art, 2–3 words: "ROUTE TICKETS". */
  coverWord: string;
  problemStatement: string;
  userRole: string;
  projectType: string;
  difficulty: Difficulty;
  estMinutes: number;
  maxXp: number;
  tools: string[];
  workflows: string[];
  skills: string[];
  deliverables: Deliverable[];
  kickoff: { segments: KickoffSegment[] };
  pou: PouQuestion[];
  stages: Stage[];
  /** Position on the world map as percentages of the map canvas. */
  map: { x: number; y: number };
}

export type TrainingKind = "skill" | "mindset" | "communication";
export interface Training {
  id: Id;
  kind: TrainingKind;
  title: string;
  summary: string;
  minutes: number;
  tags: string[];
  /** Career ids this is recommended for. */
  recommendedFor: Id[];
  lessons: { title: string; body: string; caption?: string }[];
}

export interface JobApplyField {
  key: string;
  label: string;
  type: "text" | "textarea" | "email" | "url" | "select";
  options?: string[];
  required: boolean;
}

export interface Job {
  id: Id;
  company: string; // fictional
  title: string;
  location: string;
  remote: boolean;
  salary: string;
  careerId: Id;
  /** Minimum learner level to be eligible. */
  minLevel: number;
  description: string;
  requirements: string[];
  /** If true, the assist-apply agent can draft the application. */
  autoApplicable: boolean;
  applyFields: JobApplyField[];
}

// ───────────────────────────── Learner state ─────────────────────────────

export interface VisionBoard {
  targetRole: string;
  level: string; // "Junior" | "Mid" ...
  industry: string;
  companyType: string; // "Startup" | "Scale-up" | "Enterprise" ...
  location: string;
  timeline: string; // "3 months"
  why?: string;
  /** What the learner already knows: studies, current job, skills (free text). */
  background?: string;
  /** PNG data URL of the FTUX drawing. */
  drawingDataUrl?: string;
}

export interface UserSettings {
  launchAtLogin: boolean;
  menuBarStatus: boolean;
  theme: "system" | "light" | "dark";
  sounds: { enabled: boolean; volume: number };
  notifications: Record<NotificationCategory, boolean> & { osDelivery: boolean };
  /** ttsNatural: speak with the server's voice model (Gemini or Kokoro) instead of the system voice. */
  voice: { stt: "apple" | "typed"; ttsEnabled: boolean; ttsRate: number; ttsNatural: boolean };
  aiModel: "quality" | "fast";
  devices: { cameraId?: string; micId?: string; speakerId?: string };
  privacy: { shareAnalytics: boolean; storeRecordings: boolean };
}

export interface User {
  id: Id;
  email: string;
  name: string;
  createdAt: IsoDate;
  careerId: Id | null;
  plan: PlanId;
  onboardingComplete: boolean;
  vision: VisionBoard | null;
  settings: UserSettings;
}

export interface RubricScore {
  level: RubricLevel;
  /** One sentence tied to evidence. */
  rationale: string;
}
export type Rubric = Record<RubricAxis, RubricScore>;

export interface ChatMessage {
  id: Id;
  role: "npc" | "learner" | "system";
  text: string;
  at: IsoDate;
}

export interface NoteVerdict {
  accepted: boolean;
  covered: string[];
  missing: string[];
  feedback: string;
  /** XP attached to this verdict (held until PoU passes). 0 if not accepted. */
  xp: number;
}

export interface PouTurn {
  id: Id;
  role: "npc" | "learner";
  text: string;
  questionId: Id;
  at: IsoDate;
}

export interface PouState {
  status: "not_started" | "in_progress" | "passed" | "needs_retry";
  turns: PouTurn[];
  /** Index into scenario.pou of the question currently being asked. */
  questionIndex: number;
  /** Whether the follow-up for the current question has been asked. */
  followUpAsked: boolean;
}

export interface Submission {
  id: Id;
  kind: SubmissionKind;
  /** Text body, URL, or uploaded file URL (from POST /api/uploads). */
  value: string;
  fileName?: string;
  createdAt: IsoDate;
}

export interface Evaluation {
  id: Id;
  rubric: Rubric;
  overall: RubricLevel;
  summary: string;
  strengths: string[];
  improvements: string[];
  xp: number;
  passed: boolean;
  createdAt: IsoDate;
}

export type StageMode = "plan" | "do" | "learn";
export type StageStatus = "locked" | "available" | "in_progress" | "submitted" | "completed";

export interface StageProgress {
  stageId: Id;
  status: StageStatus;
  mode: StageMode;
  agreedRequirements: string[];
  estimatedMinutes: number | null;
  planComplete: boolean;
  planMessages: ChatMessage[];
  learnMessages: ChatMessage[];
  learnCompleted: Id[];
  todos: { id: Id; text: string; done: boolean }[];
  submissions: Submission[];
  evaluation: Evaluation | null;
  startedAt: IsoDate | null;
  timeSpentSec: number;
}

export type ScenarioStatus = "locked" | "available" | "in_progress" | "completed";
export type ObjectivePhase = "brief" | "kickoff" | "pou" | "stages" | "complete";

/** A learner's run through one scenario. */
export interface Objective {
  id: Id;
  scenarioId: Id;
  status: ScenarioStatus;
  phase: ObjectivePhase;
  startedAt: IsoDate;
  completedAt: IsoDate | null;
  timeSpentSec: number;
  xpEarned: number;
  xpHeld: number;
  currentStageId: Id | null;
  /** Rolling four-axis performance across everything graded so far. */
  performance: Rubric | null;
  notes: Record<NoteSection, string>;
  /** Keyed by kickoff segment id. */
  noteVerdicts: Record<Id, NoteVerdict>;
  /** Kickoff segment ids the learner has watched. */
  kickoffWatched: Id[];
  kickoffQuestions: { segmentId: Id; question: string; answer: string; at: IsoDate }[];
  pou: PouState;
  /** Keyed by stage id. */
  stages: Record<Id, StageProgress>;
}

/** Scenario as listed on the world map / carousel, merged with the learner's status. */
export interface ScenarioCard {
  id: Id;
  careerId: Id;
  order: number;
  title: string;
  coverWord: string;
  company: Company;
  npc: Npc;
  difficulty: Difficulty;
  estMinutes: number;
  maxXp: number;
  stageCount: number;
  map: { x: number; y: number };
  status: ScenarioStatus;
  objectiveId: Id | null;
  xpEarned: number;
  timeSpentSec: number;
  performance: RubricLevel | null;
}

/** Full scenario plus resolved company/npc, returned by GET /api/scenarios/:id. */
export interface ScenarioDetail extends Scenario {
  company: Company;
  npc: Npc;
}

export interface XpEvent {
  id: Id;
  amount: number;
  reason: string;
  scenarioId: Id | null;
  held: boolean;
  createdAt: IsoDate;
}

export interface Progress {
  xp: number;
  heldXp: number;
  level: number;
  floor: number;
  nextThreshold: number | null;
  xpIntoLevel: number;
  xpToNext: number;
  ratio: number;
  streak: { current: number; best: number };
  completedScenarios: number;
  events: XpEvent[];
}

export interface LedgerEntry {
  id: Id;
  delta: number; // negative = spend, positive = grant
  category: CreditCategory | "grant";
  reason: string;
  createdAt: IsoDate;
}

export interface CreditsSummary {
  plan: PlanId;
  /** null = unlimited plan. */
  balance: number | null;
  allowance: number | null;
  renewsAt: IsoDate | null;
  expiresAt: IsoDate | null;
  usageByCategory: Record<CreditCategory, number>;
  /** Spend per day for the last 14 days, oldest first. */
  daily: { date: string; spent: number }[];
  recent: LedgerEntry[];
}

export interface NotificationItem {
  id: Id;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: IsoDate;
  read: boolean;
  /** In-app route to open, e.g. "/objective/abc". */
  link?: string;
}

export interface TrainingProgress {
  trainingId: Id;
  lessonIndex: number;
  completed: boolean;
  updatedAt: IsoDate;
}

export interface PortfolioProject {
  scenarioId: Id;
  title: string;
  company: string;
  summary: string;
  overall: RubricLevel;
  xp: number;
  completedAt: IsoDate;
}

export interface Portfolio {
  headline: string;
  bio: string;
  skills: string[];
  projects: PortfolioProject[];
  shareSlug: string;
  unlocked: boolean;
}

export interface JobApplication {
  id: Id;
  jobId: Id;
  status: "draft" | "ready" | "submitted";
  /** Keyed by JobApplyField.key. */
  answers: Record<string, string>;
  /** Which answers were AI-guessed (the learner should review these). */
  guessed: string[];
  coverLetter: string;
  log: { at: IsoDate; text: string }[];
  createdAt: IsoDate;
}

export type FtuxStep = "draw" | "chat" | "recommend" | "roadmap" | "why" | "claim" | "done";

export interface FtuxView {
  sessionId: Id;
  step: FtuxStep;
  /** Headline / question for this step. */
  prompt: string;
  /** Quick-reply chips. */
  chips: string[];
  /** Conversation so far (chat step). */
  messages: ChatMessage[];
  /** Vision board filled in so far. */
  board: Partial<VisionBoard>;
  /**
   * Career options. kind "custom" = a path generated for this learner from their answers
   * (careerId is CUSTOM_CAREER_ID until chosen); "authored" = a ready-made path from the library.
   */
  recommendations: { careerId: Id; title: string; reason: string; match: number; kind?: "custom" | "authored"; color?: string }[];
  roadmap: { careerId: Id; scenarios: { scenarioId: Id; title: string; company: string; estMinutes: number }[] } | null;
  claim: { credits: number; claimed: boolean } | null;
}

export type FtuxTurn =
  | { kind: "CONTINUE" }
  | { kind: "DRAWN"; dataUrl: string; description?: string }
  | { kind: "MESSAGE"; text: string }
  | { kind: "SELECT_CAREER"; careerId: Id }
  | { kind: "WHY"; text: string }
  | { kind: "CLAIM" };

export interface OtaInfo {
  channel: string;
  version: string;
  notes: string;
  /** Download URL, or null when there is nothing newer. */
  url: string | null;
  publishedAt: IsoDate;
}

// ───────────────────────────── Personal career paths ─────────────────────────────

/** Everything that makes up one career path: authored (packages/content) or generated for one learner. */
export interface CareerPack {
  career: Career;
  companies: Company[];
  npcs: Npc[];
  /** Exactly 3 scenarios, order 1..3, increasing difficulty. */
  scenarios: Scenario[];
}

/** What a learner asked for when their personal path was generated. Only targetRole is required. */
export interface PathRequest {
  targetRole: string;
  level?: string;
  industry?: string;
  companyType?: string;
  location?: string;
  timeline?: string;
  why?: string;
  background?: string;
}

/** A learner's generated path, as shown in Settings → Career. */
export interface CareerPathSummary {
  careerId: Id;
  title: string;
  /** "live" = written by the configured model; "practice" = the offline template generator. */
  engine: "live" | "practice";
  provider: string;
  request: PathRequest;
  scenarioTitles: string[];
  createdAt: IsoDate;
}
