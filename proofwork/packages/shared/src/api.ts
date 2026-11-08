// REST contract between renderer/desktop and the server.
// Every route lives under `${serverUrl}/api`. All bodies/responses are JSON unless noted.
// Auth: `Authorization: Bearer <token>` on every route except those marked PUBLIC.
// Errors: non-2xx responses carry `ApiError`.
import type {
  Career,
  CareerPathSummary,
  PathRequest,
  ChatMessage,
  CreditsSummary,
  Evaluation,
  FtuxTurn,
  FtuxView,
  IsoDate,
  Job,
  JobApplication,
  NoteSection,
  NoteVerdict,
  NotificationItem,
  NpcVoice,
  Objective,
  OtaInfo,
  Portfolio,
  PouTurn,
  Progress,
  ScenarioCard,
  ScenarioDetail,
  StageMode,
  SubmissionKind,
  Training,
  TrainingProgress,
  User,
  UserSettings,
  VisionBoard,
} from "./domain.ts";
import type { PlanId, PlanInfo } from "./constants.ts";

export interface ApiError {
  error: string; // machine code, e.g. "unauthorized", "not_found", "insufficient_credits", "locked", "conflict"
  message: string; // human readable
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

export interface PresentationInput {
  transcript: string;
  durationSec: number;
  /** 0..1 share of time the face was well framed. */
  framingScore: number;
  slidesCovered: number;
  recordingUrl?: string;
}

export interface BugReportInput {
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "blocker";
  feature: string;
  screenshotDataUrl?: string;
  logs?: string;
}

/**
 * Route map. Key = "METHOD /path" (path relative to /api, `:param` placeholders).
 * `body` = JSON request body, `query` = query string, `res` = JSON response.
 */
export type TtsEngineName = "gemini" | "kokoro";

export interface TtsRequest {
  text: string;
  /** The speaker's voice settings; style picks the voice family. */
  voice?: Partial<Pick<NpcVoice, "style" | "voiceName">>;
  /** Stable speaker id (an NPC avatar seed) so each character keeps one voice. */
  speaker?: string;
}

export interface AiDegraded {
  reason: "billing" | "auth" | "rate_limit" | "error";
  message: string;
  since: IsoDate;
}

export interface ApiRoutes {
  // ── health / auth ──
  /** PUBLIC */
  "GET /health": {
    res: {
      ok: true;
      aiMode: "live" | "mock";
      provider: "gemini" | "anthropic" | "practice";
      models: { quality: string; fast: string };
      /** Set while live calls are failing (for example the provider's credits ran out); replies come from practice. */
      degraded: AiDegraded | null;
      /** Natural voice engines in order of preference; empty means the renderer uses the system voice. */
      tts: { engines: TtsEngineName[] };
      version: string;
    };
  };
  /**
   * Speech for `text` (max 600 characters) as audio/wav. The x-tts-engine response header names the engine that
   * spoke. Binary, so the renderer calls it with fetch rather than the JSON client. 503 when no engine can speak.
   */
  "POST /tts": { body: TtsRequest; res: Blob };
  /** PUBLIC. Local auth: email + display name, no password (dev product). Creates the user on first login. */
  "POST /auth/login": { body: { email: string; name?: string }; res: AuthResponse };
  /** PUBLIC. Begins the browser → deep-link login. Returns the URL the desktop opens in the system browser. */
  "POST /auth/desktop/start": { body: { state: string }; res: { url: string } };
  // (PUBLIC HTML) GET /api/auth/web?state=… renders a login form; on submit redirects to
  //   proofwork://auth/callback?token=<jwt>&state=<state>

  // ── me ──
  "GET /me": { res: User };
  "PATCH /me": {
    body: { name?: string; careerId?: string; vision?: Partial<VisionBoard>; settings?: DeepPartial<UserSettings> };
    res: User;
  };
  "DELETE /me": { res: { ok: true } };
  "GET /me/export": { res: Record<string, unknown> };
  /** The learner's current generated path (null when they are on an authored career). */
  "GET /me/path": { res: { path: CareerPathSummary | null } };
  /**
   * Generates a new personal path from the request and makes it the learner's career.
   * Debits CREDIT_COSTS.path_generation (402 if insufficient). Old objectives stay readable.
   */
  "POST /me/path": { body: PathRequest; res: { path: CareerPathSummary; career: Career; scenarios: ScenarioCard[] } };

  // ── catalog ──
  /** Authored careers plus the learner's own generated path(s). */
  "GET /careers": { res: Career[] };
  /** Cards for the learner's career (or ?careerId=), merged with learner status. */
  "GET /scenarios": { query?: { careerId?: string }; res: ScenarioCard[] };
  "GET /scenarios/:id": { res: ScenarioDetail };
  "GET /trainings": { res: Training[] };
  "GET /me/trainings": { res: { library: string[]; progress: Record<string, TrainingProgress>; recommended: string[] } };
  "POST /me/trainings": { body: { trainingId: string }; res: { library: string[] } };
  "DELETE /me/trainings/:id": { res: { library: string[] } };
  "POST /me/trainings/:id/progress": { body: { lessonIndex: number; completed: boolean }; res: TrainingProgress };

  // ── onboarding (FTUX step machine: draw → chat → why → recommend → roadmap → claim → done) ──
  /** Resumes the user's open session if one exists. */
  "POST /onboarding/session-start": { res: FtuxView };
  /** 409 response body is the authoritative FtuxView (resume / double submit). */
  "POST /onboarding/session-turn": { body: { sessionId: string; turn: FtuxTurn }; res: FtuxView };

  // ── objectives (a learner's run through a scenario) ──
  "GET /objectives": { res: Objective[] };
  /** Idempotent: returns the existing objective for this scenario if any. 403 "locked" if not unlocked. */
  "POST /objectives": { body: { scenarioId: string }; res: Objective };
  "GET /objectives/:id": { res: Objective };
  "PATCH /objectives/:id": { body: { phase?: Objective["phase"]; notes?: Partial<Record<NoteSection, string>> }; res: Objective };
  "POST /objectives/:id/kickoff/watched": { body: { segmentId: string }; res: Objective };
  "POST /objectives/:id/kickoff/notes-check": {
    body: { segmentId: string; text: string };
    res: { verdict: NoteVerdict; objective: Objective };
  };
  "POST /objectives/:id/kickoff/ask": { body: { segmentId: string; question: string }; res: { answer: string; objective: Objective } };
  /** Moves phase → "pou". 409 unless every segment has an accepted note. */
  "POST /objectives/:id/kickoff/complete": { res: Objective };
  /** Returns the first (or current) manager question. */
  "POST /objectives/:id/pou/start": { res: { question: PouTurn; objective: Objective } };
  "POST /objectives/:id/pou/answer": {
    body: { transcript: string };
    /** reaction = manager's spoken reaction; next = next question/follow-up (absent when finished). */
    res: { reaction: PouTurn; next: PouTurn | null; status: Objective["pou"]["status"]; objective: Objective };
  };
  "POST /objectives/:id/stages/:stageId/start": { res: Objective };
  "POST /objectives/:id/stages/:stageId/mode": { body: { mode: StageMode }; res: Objective };
  "POST /objectives/:id/stages/:stageId/plan": {
    body: { message: string };
    res: { reply: ChatMessage; objective: Objective };
  };
  "POST /objectives/:id/stages/:stageId/learn/chat": { body: { message: string }; res: { reply: ChatMessage; objective: Objective } };
  "POST /objectives/:id/stages/:stageId/learn/:itemId/complete": { res: Objective };
  "POST /objectives/:id/stages/:stageId/todos": { body: { todos: { id: string; text: string; done: boolean }[] }; res: Objective };
  "POST /objectives/:id/stages/:stageId/submit": {
    body: { submissions: { kind: SubmissionKind; value: string; fileName?: string }[] };
    res: { evaluation: Evaluation; objective: Objective };
  };
  /** Only valid for the stage whose kind === "presentation". */
  "POST /objectives/:id/stages/:stageId/presentation": { body: PresentationInput; res: { evaluation: Evaluation; objective: Objective } };
  /** Focus-presence ping: adds time on task. */
  "POST /objectives/:id/time": { body: { seconds: number; stageId?: string }; res: { ok: true } };

  // ── progress / xp ──
  "GET /progress": { res: Progress };

  // ── credits & billing (simulated: no real payments) ──
  "GET /credits": { res: CreditsSummary };
  "GET /plans": { res: PlanInfo[] };
  "POST /credits/plan": { body: { plan: PlanId }; res: CreditsSummary };
  "POST /credits/topup": { body: { amount: number }; res: CreditsSummary };

  // ── notifications ──
  "GET /notifications": { res: NotificationItem[] };
  "POST /notifications/:id/read": { res: { ok: true } };
  "POST /notifications/read-all": { res: { ok: true } };

  // ── portfolio & jobs ──
  "GET /portfolio": { res: Portfolio };
  "PATCH /portfolio": { body: { headline?: string; bio?: string }; res: Portfolio };
  "GET /jobs": { res: { unlocked: boolean; jobs: Job[] } };
  "GET /applications": { res: JobApplication[] };
  /** Assist-apply: drafts answers from the profile (AI). Human reviews; nothing is sent anywhere. */
  "POST /jobs/:id/applications": { res: JobApplication };
  "PATCH /applications/:id": { body: { answers?: Record<string, string>; status?: JobApplication["status"]; coverLetter?: string }; res: JobApplication };

  // ── coach / support ──
  "POST /coach/chat": { body: { message: string }; res: { reply: ChatMessage; history: ChatMessage[] } };
  "GET /coach/history": { res: ChatMessage[] };
  "POST /support/bug": { body: BugReportInput; res: { id: string } };
  "GET /support/thread": { res: ChatMessage[] };
  "POST /support/thread": { body: { text: string }; res: ChatMessage[] };

  // ── files / updates ──
  // POST /api/uploads — multipart/form-data, field "file" (≤ 25 MB) → UploadResult. Files served at GET /files/:name (PUBLIC).
  "GET /ota/:channel": { res: OtaInfo };
}

export interface UploadResult {
  id: string;
  url: string; // absolute URL served by the server
  fileName: string;
  size: number;
  mime: string;
}

export type ApiRoute = keyof ApiRoutes;
export type RouteBody<R extends ApiRoute> = ApiRoutes[R] extends { body: infer B } ? B : undefined;
export type RouteQuery<R extends ApiRoute> = ApiRoutes[R] extends { query?: infer Q } ? Q : undefined;
export type RouteRes<R extends ApiRoute> = ApiRoutes[R] extends { res: infer T } ? T : never;
