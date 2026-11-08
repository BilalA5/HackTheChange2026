// Core API tests: auth, onboarding, the objective game loop, credits, uploads and the notifications socket.
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { FastifyInstance } from "fastify";
import type {
  AuthResponse,
  CreditsSummary,
  FtuxView,
  Job,
  NotificationItem,
  Objective,
  Portfolio,
  Progress,
  ScenarioCard,
  TrainingProgress,
  User,
} from "@pw/shared";
import { buildServer } from "../src/app.ts";
import {
  CAREER_ID,
  FIXTURE_CONTENT,
  JOB_ID,
  PRESENTATION_STAGE_ID,
  SCENARIO_ONE_ID,
  SCENARIO_TWO_ID,
  TRAINING_ID,
  WORK_STAGE_ID,
} from "./fixtures.ts";
import { createStubAi, type StubState } from "./stubAi.ts";

type Method = "GET" | "POST" | "PATCH" | "DELETE";

interface Api<T> {
  status: number;
  body: T;
}

async function send<T>(app: FastifyInstance, method: Method, url: string, token: string | null, payload?: unknown): Promise<Api<T>> {
  const res = await app.inject({
    method,
    url,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    payload: payload as Record<string, unknown> | undefined,
  });
  const text = res.body;
  return { status: res.statusCode, body: (text ? JSON.parse(text) : null) as T };
}

function startApp(dir: string, state: { stub: ReturnType<typeof createStubAi> }) {
  return buildServer({ dbPath: join(dir, "test.db"), dataDir: dir, ai: state.stub.ai, content: FIXTURE_CONTENT, logger: false });
}

describe("Proofwork core API", () => {
  let dir: string;
  let app: FastifyInstance;
  let stub: ReturnType<typeof createStubAi>;
  let token = "";
  let user: User;
  let sessionId = "";
  let objectiveId = "";
  let balance = 0;
  let uploadUrl = "";

  before(async () => {
    dir = mkdtempSync(join(tmpdir(), "pw-core-"));
    stub = createStubAi();
    app = await startApp(dir, { stub });
  });

  after(async () => {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  });

  describe("auth", () => {
    it("returns 401 without a token", async () => {
      const res = await send<{ error: string }>(app, "GET", "/api/me", null);
      assert.equal(res.status, 401);
      assert.equal(res.body.error, "unauthorized");
    });

    it("returns 401 for a bad token", async () => {
      const res = await send<{ error: string }>(app, "GET", "/api/me", "not-a-jwt");
      assert.equal(res.status, 401);
    });

    it("logs in, lowercases the email, creates the user and grants starter credits", async () => {
      const res = await send<AuthResponse>(app, "POST", "/api/auth/login", null, { email: "Ada.Lovelace@Example.com" });
      assert.equal(res.status, 200);
      token = res.body.token;
      user = res.body.user;
      assert.equal(user.email, "ada.lovelace@example.com");
      assert.equal(user.name, "Ada.lovelace");
      assert.equal(user.plan, "free");
      assert.equal(user.onboardingComplete, false);
      assert.equal(user.settings.sounds.volume, 0.6);
      assert.equal(user.settings.voice.stt, "apple");

      const credits = await send<CreditsSummary>(app, "GET", "/api/credits", token);
      balance = credits.body.balance ?? -1;
      assert.equal(balance, 10_000);
      assert.equal(credits.body.expiresAt !== null, true);

      const notes = await send<NotificationItem[]>(app, "GET", "/api/notifications", token);
      assert.equal(notes.body.length, 1);
      assert.equal(notes.body[0]?.title, "Welcome to Proofwork");
    });

    it("does not grant starter credits twice on a second login", async () => {
      await send<AuthResponse>(app, "POST", "/api/auth/login", null, { email: "ada.lovelace@example.com" });
      const credits = await send<CreditsSummary>(app, "GET", "/api/credits", token);
      assert.equal(credits.body.balance, balance);
    });

    it("rejects an invalid email with 400", async () => {
      const res = await send<{ error: string }>(app, "POST", "/api/auth/login", null, { email: "not-an-email" });
      assert.equal(res.status, 400);
      assert.equal(res.body.error, "bad_request");
    });

    it("builds the desktop hand-off URL and renders the sign-in page with the state escaped", async () => {
      const start = await send<{ url: string }>(app, "POST", "/api/auth/desktop/start", null, { state: "abc123" });
      assert.equal(start.status, 200);
      assert.match(start.body.url, /\/api\/auth\/web\?state=abc123$/);

      const page = await app.inject({ method: "GET", url: "/api/auth/web?state=abc%3Cscript%3E" });
      assert.equal(page.statusCode, 200);
      assert.match(page.body, /Sign in to Proofwork/);
      assert.match(page.body, /\\u003cscript>/);
      assert.doesNotMatch(page.body, /<script>alert/);
    });
  });

  describe("profile", () => {
    it("loads /me and merges settings strictly", async () => {
      const me = await send<User>(app, "GET", "/api/me", token);
      assert.equal(me.body.id, user.id);

      const patched = await send<User>(app, "PATCH", "/api/me", token, {
        settings: { sounds: { volume: 0.3 }, theme: "dark" },
        vision: { targetRole: "AI Engineer" },
      });
      assert.equal(patched.status, 200);
      assert.equal(patched.body.settings.sounds.volume, 0.3);
      assert.equal(patched.body.settings.sounds.enabled, true);
      assert.equal(patched.body.settings.theme, "dark");
      assert.equal(patched.body.vision?.targetRole, "AI Engineer");

      const unknown = await send<{ error: string }>(app, "PATCH", "/api/me", token, { settings: { nope: true } });
      assert.equal(unknown.status, 400);
      const badCareer = await send<{ error: string }>(app, "PATCH", "/api/me", token, { careerId: "no-such-career" });
      assert.equal(badCareer.status, 400);
    });
  });

  describe("onboarding", () => {
    it("starts a session and runs the step machine to done", async () => {
      const start = await send<FtuxView>(app, "POST", "/api/onboarding/session-start", token);
      assert.equal(start.body.step, "draw");
      sessionId = start.body.sessionId;

      const turns = [
        { kind: "DRAWN", dataUrl: "data:image/png;base64,iVBORw0KGgo=" },
        { kind: "MESSAGE", text: "I want to build agents" },
        { kind: "SELECT_CAREER", careerId: CAREER_ID },
        { kind: "CONTINUE" },
        { kind: "WHY", text: "To ship real work" },
        { kind: "CLAIM" },
      ];
      let last: FtuxView | null = null;
      for (const turn of turns) {
        const res = await send<FtuxView>(app, "POST", "/api/onboarding/session-turn", token, { sessionId, turn });
        assert.equal(res.status, 200);
        last = res.body;
      }
      assert.equal(last?.step, "done");

      const me = await send<User>(app, "GET", "/api/me", token);
      assert.equal(me.body.onboardingComplete, true);
      assert.equal(me.body.careerId, CAREER_ID);
      assert.equal(me.body.vision?.targetRole, "I want to build agents");
    });

    it("answers 409 with the authoritative view for a finished session", async () => {
      const res = await send<FtuxView>(app, "POST", "/api/onboarding/session-turn", token, { sessionId, turn: { kind: "CONTINUE" } });
      assert.equal(res.status, 409);
      assert.equal(res.body.step, "done");
    });

    it("404s a session that belongs to someone else", async () => {
      const other = await send<AuthResponse>(app, "POST", "/api/auth/login", null, { email: "grace@example.com" });
      const res = await send<{ error: string }>(app, "POST", "/api/onboarding/session-turn", other.body.token, {
        sessionId,
        turn: { kind: "CONTINUE" },
      });
      assert.equal(res.status, 404);
    });

    it("adds the career's recommended trainings to the library", async () => {
      const trainings = await send<{ library: string[]; recommended: string[] }>(app, "GET", "/api/me/trainings", token);
      assert.ok(trainings.body.library.includes(TRAINING_ID));
      assert.ok(trainings.body.recommended.includes(TRAINING_ID));
    });
  });

  describe("catalog and unlocks", () => {
    it("lists cards with scenario two locked", async () => {
      const cards = await send<ScenarioCard[]>(app, "GET", "/api/scenarios", token);
      assert.equal(cards.status, 200);
      assert.equal(cards.body.length, 2);
      assert.equal(cards.body[0]?.status, "available");
      assert.equal(cards.body[1]?.status, "locked");
    });

    it("refuses to start scenario two while it is locked", async () => {
      const res = await send<{ error: string }>(app, "POST", "/api/objectives", token, { scenarioId: SCENARIO_TWO_ID });
      assert.equal(res.status, 403);
      assert.equal(res.body.error, "locked");
    });

    it("returns 404 for unknown scenarios", async () => {
      const res = await send<{ error: string }>(app, "POST", "/api/objectives", token, { scenarioId: "nope" });
      assert.equal(res.status, 404);
    });

    it("loads scenario detail with company and npc", async () => {
      const res = await send<{ company: { name: string }; npc: { name: string } }>(app, "GET", `/api/scenarios/${SCENARIO_ONE_ID}`, token);
      assert.equal(res.status, 200);
      assert.equal(res.body.company.name, "Kettle Commerce");
      assert.equal(res.body.npc.name, "Maya Ortiz");
    });

    it("tracks prompt-learning progress and does not re-debit a repeated lesson", async () => {
      const first = await send<TrainingProgress>(app, "POST", `/api/me/trainings/${TRAINING_ID}/progress`, token, {
        lessonIndex: 0,
        completed: false,
      });
      assert.equal(first.status, 200);
      balance -= 3;
      const again = await send<TrainingProgress>(app, "POST", `/api/me/trainings/${TRAINING_ID}/progress`, token, {
        lessonIndex: 0,
        completed: true,
      });
      assert.equal(again.body.completed, true);
      const credits = await send<CreditsSummary>(app, "GET", "/api/credits", token);
      assert.equal(credits.body.balance, balance);
    });
  });

  describe("scenario one, end to end", () => {
    it("opens an objective idempotently and starts in the brief phase", async () => {
      const first = await send<Objective>(app, "POST", "/api/objectives", token, { scenarioId: SCENARIO_ONE_ID });
      assert.equal(first.status, 200);
      assert.equal(first.body.phase, "brief");
      assert.equal(first.body.status, "in_progress");
      assert.equal(first.body.pou.status, "not_started");
      objectiveId = first.body.id;
      const second = await send<Objective>(app, "POST", "/api/objectives", token, { scenarioId: SCENARIO_ONE_ID });
      assert.equal(second.body.id, objectiveId);
    });

    it("watches the kickoff and grades notes; only first acceptance grants held XP", async () => {
      for (const segmentId of ["one-seg-1", "one-seg-2", "one-seg-3"]) {
        const res = await send<Objective>(app, "POST", `/api/objectives/${objectiveId}/kickoff/watched`, token, { segmentId });
        assert.equal(res.status, 200);
      }
      const watched = await send<Objective>(app, "GET", `/api/objectives/${objectiveId}`, token);
      assert.equal(watched.body.phase, "kickoff");
      assert.equal(watched.body.kickoffWatched.length, 3);

      const rejected = await send<{ verdict: { accepted: boolean; xp: number } }>(app, "POST", `/api/objectives/${objectiveId}/kickoff/notes-check`, token, {
        segmentId: "one-seg-1",
        text: "too short",
      });
      assert.equal(rejected.body.verdict.accepted, false);
      assert.equal(rejected.body.verdict.xp, 0);
      balance -= 8;

      const problem = await send<{ verdict: { accepted: boolean; xp: number } }>(app, "POST", `/api/objectives/${objectiveId}/kickoff/notes-check`, token, {
        segmentId: "one-seg-1",
        text: "The tickets are routed by hand and it is slow.",
      });
      assert.equal(problem.body.verdict.accepted, true);
      assert.equal(problem.body.verdict.xp, 100);
      balance -= 8;

      const outcome = await send<{ verdict: { xp: number }; objective: Objective }>(app, "POST", `/api/objectives/${objectiveId}/kickoff/notes-check`, token, {
        segmentId: "one-seg-2",
        text: "Routing should take under a minute per ticket.",
      });
      assert.equal(outcome.body.verdict.xp, 200);
      balance -= 8;

      const process = await send<{ verdict: { xp: number }; objective: Objective }>(app, "POST", `/api/objectives/${objectiveId}/kickoff/notes-check`, token, {
        segmentId: "one-seg-3",
        text: "We will pilot with one queue, then expand.",
      });
      assert.equal(process.body.verdict.xp, 100);
      assert.equal(process.body.objective.xpHeld, 400);
      balance -= 8;

      const resubmit = await send<{ verdict: { xp: number } }>(app, "POST", `/api/objectives/${objectiveId}/kickoff/notes-check`, token, {
        segmentId: "one-seg-1",
        text: "The tickets are routed by hand and it is slow, really.",
      });
      assert.equal(resubmit.body.verdict.xp, 0);
      balance -= 8;

      const progress = await send<Progress>(app, "GET", "/api/progress", token);
      assert.equal(progress.body.xp, 0);
      assert.equal(progress.body.heldXp, 400);
    });

    it("answers a kickoff question and completes the kickoff", async () => {
      const ask = await send<{ answer: string }>(app, "POST", `/api/objectives/${objectiveId}/kickoff/ask`, token, {
        segmentId: "one-seg-2",
        question: "Who owns the queues?",
      });
      assert.equal(ask.status, 200);
      assert.match(ask.body.answer, /Who owns the queues/);
      balance -= 6;

      const complete = await send<Objective>(app, "POST", `/api/objectives/${objectiveId}/kickoff/complete`, token);
      assert.equal(complete.status, 200);
      assert.equal(complete.body.phase, "pou");
    });

    it("runs the proof of understanding with one follow-up, releasing held XP on pass", async () => {
      const start = await send<{ question: { text: string }; objective: Objective }>(app, "POST", `/api/objectives/${objectiveId}/pou/start`, token);
      assert.equal(start.status, 200);
      assert.match(start.body.question.text, /approach one-q1/);
      assert.equal(start.body.objective.pou.status, "in_progress");

      const partial = await send<{ reaction: { role: string }; next: { text: string } | null; status: string }>(
        app,
        "POST",
        `/api/objectives/${objectiveId}/pou/answer`,
        token,
        { transcript: "A vague first answer." },
      );
      assert.equal(partial.status, 200);
      assert.equal(partial.body.reaction.role, "npc");
      assert.equal(partial.body.next?.text, "Can you be more specific about one-q1?");
      balance -= 15;

      const followUp = await send<{ next: { text: string } | null; status: string; objective: Objective }>(
        app,
        "POST",
        `/api/objectives/${objectiveId}/pou/answer`,
        token,
        { transcript: "A clear and specific follow-up." },
      );
      assert.equal(followUp.body.objective.pou.questionIndex, 1);
      assert.match(followUp.body.next?.text ?? "", /one-q2/);
      balance -= 15;

      const secondQuestion = await send<{ next: unknown; status: string; objective: Objective }>(
        app,
        "POST",
        `/api/objectives/${objectiveId}/pou/answer`,
        token,
        { transcript: "A clear answer." },
      );
      balance -= 15;
      assert.equal(secondQuestion.body.next, null);
      assert.equal(secondQuestion.body.status, "passed");
      const done = secondQuestion.body.objective;
      assert.equal(done.phase, "stages");
      assert.equal(done.xpHeld, 0);
      assert.equal(done.xpEarned, 550);
      assert.equal(done.currentStageId, WORK_STAGE_ID);
      assert.equal(done.stages[WORK_STAGE_ID]?.status, "available");

      const progress = await send<Progress>(app, "GET", "/api/progress", token);
      assert.equal(progress.body.xp, 550);
      assert.equal(progress.body.heldXp, 0);
      assert.equal(progress.body.level, 0);
    });

    it("plans, learns and sets todos in the work stage", async () => {
      const start = await send<Objective>(app, "POST", `/api/objectives/${objectiveId}/stages/${WORK_STAGE_ID}/start`, token);
      assert.equal(start.body.stages[WORK_STAGE_ID]?.status, "in_progress");
      assert.equal(start.body.stages[WORK_STAGE_ID]?.mode, "plan");

      const planQuestion = await send<{ reply: { role: string } }>(app, "POST", `/api/objectives/${objectiveId}/stages/${WORK_STAGE_ID}/plan`, token, {
        message: "What is in scope?",
      });
      assert.equal(planQuestion.body.reply.role, "npc");
      balance -= 6;

      const planDone = await send<{ objective: Objective }>(app, "POST", `/api/objectives/${objectiveId}/stages/${WORK_STAGE_ID}/plan`, token, {
        message: "Let us agree on the scope.",
      });
      const planStage = planDone.body.objective.stages[WORK_STAGE_ID];
      assert.equal(planStage?.planComplete, true);
      assert.equal(planStage?.estimatedMinutes, 45);
      assert.equal(planStage?.todos.length, 2);
      balance -= 6;

      const mode = await send<Objective>(app, "POST", `/api/objectives/${objectiveId}/stages/${WORK_STAGE_ID}/mode`, token, { mode: "learn" });
      assert.equal(mode.body.stages[WORK_STAGE_ID]?.mode, "learn");

      const tutor = await send<{ reply: { text: string } }>(app, "POST", `/api/objectives/${objectiveId}/stages/${WORK_STAGE_ID}/learn/chat`, token, {
        message: "Explain routing",
      });
      assert.equal(tutor.body.reply.text, "Tutor says: Explain routing");
      balance -= 5;

      const learned = await send<Objective>(app, "POST", `/api/objectives/${objectiveId}/stages/${WORK_STAGE_ID}/learn/li-routing/complete`, token);
      assert.deepEqual(learned.body.stages[WORK_STAGE_ID]?.learnCompleted, ["li-routing"]);

      const todos = await send<Objective>(app, "POST", `/api/objectives/${objectiveId}/stages/${WORK_STAGE_ID}/todos`, token, {
        todos: [{ id: "t1", text: "Draft rules", done: true }],
      });
      assert.equal(todos.body.stages[WORK_STAGE_ID]?.todos.length, 1);

      const time = await send<{ ok: boolean }>(app, "POST", `/api/objectives/${objectiveId}/time`, token, {
        seconds: 9999,
        stageId: WORK_STAGE_ID,
      });
      assert.equal(time.body.ok, true);
      const after = await send<Objective>(app, "GET", `/api/objectives/${objectiveId}`, token);
      assert.equal(after.body.timeSpentSec, 300);
      assert.equal(after.body.stages[WORK_STAGE_ID]?.timeSpentSec, 300);
    });

    it("uploads a text file and submits work that uses it", async () => {
      const content = "# Routing notes\n\nRoute by intent to the right queue.";
      const boundary = "----pwtestboundary";
      const body = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="routing notes.md"\r\nContent-Type: text/markdown\r\n\r\n${content}\r\n--${boundary}--\r\n`,
      );
      const res = await app.inject({
        method: "POST",
        url: "/api/uploads",
        headers: { authorization: `Bearer ${token}`, "content-type": `multipart/form-data; boundary=${boundary}` },
        payload: body,
      });
      assert.equal(res.statusCode, 200);
      const upload = JSON.parse(res.body) as { url: string; fileName: string; size: number };
      assert.equal(upload.fileName, "routing notes.md");
      assert.equal(upload.size, Buffer.byteLength(content));
      uploadUrl = upload.url;
    });

    it("rejects a submission kind the stage does not accept and a presentation on a work stage", async () => {
      const wrongKind = await send<{ error: string }>(app, "POST", `/api/objectives/${objectiveId}/stages/${WORK_STAGE_ID}/submit`, token, {
        submissions: [{ kind: "github", value: "https://github.com/example/repo" }],
      });
      assert.equal(wrongKind.status, 400);

      const wrongEndpoint = await send<{ error: string }>(app, "POST", `/api/objectives/${objectiveId}/stages/${WORK_STAGE_ID}/presentation`, token, {
        transcript: "hi",
        durationSec: 60,
        framingScore: 0.5,
        slidesCovered: 2,
      });
      assert.equal(wrongEndpoint.status, 409);
    });

    it("grades the work submission, reads the uploaded text, and awards stage XP", async () => {
      const res = await send<{ evaluation: { passed: boolean; xp: number; overall: string }; objective: Objective }>(
        app,
        "POST",
        `/api/objectives/${objectiveId}/stages/${WORK_STAGE_ID}/submit`,
        token,
        { submissions: [{ kind: "file", value: uploadUrl, fileName: "routing notes.md" }] },
      );
      assert.equal(res.status, 200);
      assert.equal(res.body.evaluation.passed, true);
      assert.equal(res.body.evaluation.overall, "meeting");
      assert.equal(res.body.evaluation.xp, 240);
      assert.equal(res.body.objective.xpEarned, 790);
      assert.equal(res.body.objective.stages[WORK_STAGE_ID]?.status, "completed");
      assert.equal(res.body.objective.stages[PRESENTATION_STAGE_ID]?.status, "available");
      assert.equal(res.body.objective.currentStageId, PRESENTATION_STAGE_ID);
      balance -= 40;

      const lastGrade = stub.state.grades[stub.state.grades.length - 1];
      assert.ok(lastGrade);
      assert.ok(Object.values(lastGrade.fileTexts).some((t) => t.includes("Route by intent")));
      assert.equal(lastGrade.signals.managerQuestions, 2);
    });

    it("presents, completes the objective and unlocks the portfolio and jobs", async () => {
      const res = await send<{ evaluation: { passed: boolean; xp: number }; objective: Objective }>(
        app,
        "POST",
        `/api/objectives/${objectiveId}/stages/${PRESENTATION_STAGE_ID}/presentation`,
        token,
        { transcript: "Here is what we built.", durationSec: 300, framingScore: 0.9, slidesCovered: 6 },
      );
      assert.equal(res.status, 200);
      assert.equal(res.body.evaluation.passed, true);
      assert.equal(res.body.evaluation.xp, 200);
      assert.equal(res.body.objective.status, "completed");
      assert.equal(res.body.objective.phase, "complete");
      assert.notEqual(res.body.objective.completedAt, null);
      assert.equal(res.body.objective.xpEarned, 990);
      balance -= 40;
      assert.equal(stub.state.presentations, 1);

      const cards = await send<ScenarioCard[]>(app, "GET", "/api/scenarios", token);
      assert.equal(cards.body[0]?.status, "completed");
      assert.equal(cards.body[0]?.performance, "exceeding");
      assert.equal(cards.body[1]?.status, "available");

      const opened = await send<Objective>(app, "POST", "/api/objectives", token, { scenarioId: SCENARIO_TWO_ID });
      assert.equal(opened.status, 200);

      const jobs = await send<{ unlocked: boolean; jobs: Job[] }>(app, "GET", "/api/jobs", token);
      assert.equal(jobs.body.unlocked, true);
      assert.equal(jobs.body.jobs[0]?.id, JOB_ID);

      const portfolio = await send<Portfolio>(app, "GET", "/api/portfolio", token);
      assert.equal(portfolio.body.unlocked, true);
      assert.equal(portfolio.body.projects.length, 1);
      assert.equal(portfolio.body.projects[0]?.xp, 990);
      assert.ok(portfolio.body.skills.includes("Evaluation"));
      assert.equal(portfolio.body.headline, "Agent builder");
      assert.ok(portfolio.body.shareSlug.length > 0);
      const again = await send<Portfolio>(app, "GET", "/api/portfolio", token);
      assert.equal(again.body.shareSlug, portfolio.body.shareSlug);
    });

    it("keeps progress, streak and events consistent after the run", async () => {
      const progress = await send<Progress>(app, "GET", "/api/progress", token);
      assert.equal(progress.body.xp, 990);
      assert.equal(progress.body.heldXp, 0);
      assert.equal(progress.body.completedScenarios, 1);
      assert.equal(progress.body.streak.current, 1);
      assert.equal(progress.body.events.length > 0, true);
    });

    it("draws down credits by exactly the AI actions performed", async () => {
      const credits = await send<CreditsSummary>(app, "GET", "/api/credits", token);
      assert.equal(credits.body.balance, balance);
      assert.equal(credits.body.usageByCategory.evaluation, 40 + 45 + 40 + 40);
      assert.equal(credits.body.usageByCategory.ai_manager, 6 + 12);
      assert.equal(credits.body.usageByCategory.training, 3 + 5);
      assert.equal(credits.body.daily.length, 14);
      assert.ok((credits.body.daily[13]?.spent ?? 0) > 0);
    });

    it("serves the uploaded file with its content type", async () => {
      const path = new URL(uploadUrl).pathname;
      const res = await app.inject({ method: "GET", url: path });
      assert.equal(res.statusCode, 200);
      assert.match(res.headers["content-type"] as string, /text\/markdown/);
      assert.match(res.body, /Route by intent/);
      const missing = await app.inject({ method: "GET", url: "/files/..%2Fsecret" });
      assert.equal(missing.statusCode, 404);
    });

    it("exports the user's rows and reports the Objective list", async () => {
      const list = await send<Objective[]>(app, "GET", "/api/objectives", token);
      assert.equal(list.body.length, 2);
      const exported = await send<{ tables: Record<string, unknown[]> }>(app, "GET", "/api/me/export", token);
      assert.equal(exported.status, 200);
      assert.ok((exported.body.tables.objectives ?? []).length >= 1);
    });

    it("records bug reports, notifications and support threads", async () => {
      const bug = await send<{ id: string }>(app, "POST", "/api/support/bug", token, {
        title: "Button is slow",
        description: "The submit button takes a while.",
        severity: "low",
        feature: "Evaluation & feedback",
      });
      assert.equal(bug.status, 200);
      assert.ok(bug.body.id.length > 0);

      const support = await send<{ role: string }[]>(app, "POST", "/api/support/thread", token, { text: "Hello?" });
      assert.equal(support.body.length, 2);

      const coach = await send<{ reply: { text: string }; history: unknown[] }>(app, "POST", "/api/coach/chat", token, { message: "Next steps?" });
      assert.equal(coach.body.reply.text, "Coach: Next steps?");
      balance -= 8;
      const history = await send<unknown[]>(app, "GET", "/api/coach/history", token);
      assert.equal(history.body.length, 2);
    });
  });

  describe("notifications socket", () => {
    it("requires an auth frame, acks event keys, answers ping and pushes notifications", async () => {
      const ws = await app.injectWS("/ws/notifications");
      const queue = messageQueue(ws);

      ws.send(JSON.stringify({ action: "auth", token, session_id: "sess-1", device_id: "dev-1" }));
      assert.deepEqual(await queue.next(), { type: "connection_registered", session_id: "sess-1" });

      ws.send(JSON.stringify({ action: "ping" }));
      assert.deepEqual(await queue.next(), { type: "pong" });

      ws.send(JSON.stringify({ action: "noop", event_key: "evt-1" }));
      assert.deepEqual(await queue.next(), { type: "ack", event_key: "evt-1" });
      ws.send(JSON.stringify({ action: "noop", event_key: "evt-1" }));
      assert.deepEqual(await queue.next(), { type: "ack", event_key: "evt-1" });

      await send<{ id: string }>(app, "POST", "/api/support/bug", token, {
        title: "Socket test",
        description: "Trigger a push.",
        severity: "low",
        feature: "Notifications",
      });
      const pushed = (await queue.next()) as { type: string; item: NotificationItem };
      assert.equal(pushed.type, "notification");
      assert.equal(pushed.item.title, "Bug report received");
      ws.close();
    });

    it("rejects an unauthenticated socket with an error and close code 4401", async () => {
      const ws = await app.injectWS("/ws/notifications");
      const queue = messageQueue(ws);
      const closed = new Promise<number>((resolve) => ws.once("close", (code: number) => resolve(code)));
      ws.send(JSON.stringify({ action: "ping" }));
      assert.deepEqual(await queue.next(), {
        type: "error",
        code: "unauthorized",
        message: "Authenticate with an auth frame first.",
      });
      assert.equal(await closed, 4401);
    });
  });

  describe("sanity", () => {
    it("returns 404 JSON for unknown routes", async () => {
      const res = await send<{ error: string }>(app, "GET", "/api/does-not-exist", token);
      assert.equal(res.status, 404);
      assert.equal(res.body.error, "not_found");
    });

    it("reports health without auth", async () => {
      const res = await send<{ ok: boolean; aiMode: string; version: string }>(app, "GET", "/api/health", null);
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);
      assert.equal(res.body.aiMode, "mock");
      assert.equal(res.body.version, "0.1.0");
    });
  });
});

describe("credits exhaustion", () => {
  let dir: string;
  let app: FastifyInstance;
  let dbPath: string;

  before(async () => {
    dir = mkdtempSync(join(tmpdir(), "pw-credits-"));
    dbPath = join(dir, "credits.db");
    app = await buildServer({ dbPath, dataDir: dir, ai: createStubAi().ai, content: FIXTURE_CONTENT, logger: false });
  });

  after(async () => {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns 402 insufficient_credits once the balance is below the action cost", async () => {
    const login = await send<AuthResponse>(app, "POST", "/api/auth/login", null, { email: "broke@example.com" });
    const token = login.body.token;
    const db = new DatabaseSync(dbPath);
    try {
      const row = db.prepare("SELECT COALESCE(SUM(delta), 0) AS total FROM ledger WHERE user_id = ?").get(login.body.user.id) as { total: number };
      db.prepare("INSERT INTO ledger (id, user_id, delta, category, reason, created_at) VALUES (?, ?, ?, 'other', 'test drain', ?)").run(
        "drain-1",
        login.body.user.id,
        -(Number(row.total) - 5),
        new Date().toISOString(),
      );
    } finally {
      db.close();
    }

    const res = await send<{ error: string }>(app, "POST", "/api/coach/chat", token, { message: "Hello" });
    assert.equal(res.status, 402);
    assert.equal(res.body.error, "insufficient_credits");

    const credits = await send<CreditsSummary>(app, "GET", "/api/credits", token);
    assert.equal(credits.body.balance, 5);
  });
});

/** Queues incoming socket messages so tests can await them in order. */
function messageQueue(ws: { on(event: "message", listener: (data: unknown) => void): unknown }) {
  const items: unknown[] = [];
  const waiters: ((value: unknown) => void)[] = [];
  ws.on("message", (data: unknown) => {
    const value = JSON.parse(String(data)) as unknown;
    const waiter = waiters.shift();
    if (waiter) waiter(value);
    else items.push(value);
  });
  return {
    next: () =>
      new Promise<unknown>((resolve, reject) => {
        const ready = items.shift();
        if (ready !== undefined) return resolve(ready);
        const timer = setTimeout(() => reject(new Error("timed out waiting for a socket message")), 3000);
        waiters.push((value) => {
          clearTimeout(timer);
          resolve(value);
        });
      }),
  };
}
