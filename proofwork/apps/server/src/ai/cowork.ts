// /ws/cowork: the AI co-worker socket (see packages/shared/src/ws.ts for the protocol).
//
// Frame rules implemented here:
// - First frame must be {action:"auth"}; otherwise {type:"error", code:"unauthorized"} and close(4401).
// - Every later frame carries event_key. Keys are de-duplicated (last 500 per connection): each frame is acked,
//   but a repeated key is never processed twice.
// - ping -> pong (no event_key needed).
// - Turns are serialised per connection through one queue.
import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type {
  AuthFrame,
  ChatMessage,
  Company,
  CoworkClientMessage,
  CoworkServerMessage,
  CoworkTodo,
  Npc,
  Objective,
  PingFrame,
  Scenario,
  Stage,
  StageMode,
  StageProgress,
  User,
} from "@pw/shared";
import type { AiEngine, ModelTier, ServerContext } from "../contracts.ts";

/** Lookup of authored content. Defaults to @pw/content; tests inject a fixture. */
export interface ContentLookup {
  getScenario(id: string): Scenario | undefined;
  findStage(scenarioId: string, stageId: string): Stage | undefined;
  getNpc(id: string): Npc | undefined;
  getCompany?(id: string): Company | undefined;
}

export interface CoworkSocketOptions {
  content?: ContentLookup;
}

/** Minimal structural view of the ws socket that @fastify/websocket hands the handler. */
interface SocketLike {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  on(event: string, listener: (...args: any[]) => void): unknown;
}

export const COWORK_FILLERS = ["Let me look at your screen…", "Good question, one sec…", "Checking that against the plan…"] as const;
export const COWORK_BUDGET_MS = 20 * 60 * 1000;
const IDLE_THROTTLE_MS = 60 * 1000;
const MAX_XP_AWARDS = 3;
const MAX_KEYS = 500;
const HISTORY_MAX = 20;
const WS_UNAUTHORIZED = 4401;

async function defaultContent(): Promise<ContentLookup> {
  const c = await import("@pw/content");
  return {
    getScenario: (id) => c.getScenario(id),
    findStage: (scenarioId, stageId) => c.findStage(scenarioId, stageId),
    getNpc: (id) => c.getNpc(id),
    getCompany: (id) => c.getCompany(id),
  };
}

function rawToString(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (Buffer.isBuffer(raw)) return raw.toString("utf8");
  if (Array.isArray(raw)) return Buffer.concat(raw.map((b) => (Buffer.isBuffer(b) ? b : Buffer.from(b)))).toString("utf8");
  return String(raw);
}

/** Every frame a client may send on this socket. */
type ClientFrame = CoworkClientMessage | AuthFrame | PingFrame;

function parseFrame(raw: unknown): ClientFrame | null {
  try {
    const v: unknown = JSON.parse(rawToString(raw));
    return v && typeof v === "object" && typeof (v as { action?: unknown }).action === "string" ? (v as ClientFrame) : null;
  } catch {
    return null;
  }
}

interface Live {
  objectiveId: string;
  stageId: string;
  mode: StageMode;
  model: ModelTier | undefined;
  learnerName: string;
  scenario: Scenario;
  stage: Stage;
  npc: Npc;
  startedAt: number;
  budgetTimer: ReturnType<typeof setTimeout> | null;
}

interface Turn {
  kind: "text" | "im_lost" | "highlight" | "event" | "intro";
  input: Parameters<AiEngine["coworkTurn"]>[0]["input"];
  debit: boolean;
  screen?: { screenshot?: string; focusedApp?: string; windowTitle?: string };
  /** Learner-side line recorded in history (null = nothing to record). */
  learnerLine: { role: "learner" | "system"; text: string } | null;
}

/** Registers GET /ws/cowork on the given Fastify app. Requires @fastify/websocket to be registered. */
export function registerCoworkSocket(app: FastifyInstance, ctx: ServerContext, opts: CoworkSocketOptions = {}): void {
  app.get("/ws/cowork", { websocket: true }, (socket: unknown) => {
    handleConnection(socket as SocketLike, ctx, opts);
  });
}

function handleConnection(socket: SocketLike, ctx: ServerContext, opts: CoworkSocketOptions): void {
  let closed = false;
  let authPromise: Promise<string | null> | null = null;
  let userId: string | null = null;
  let sessionId = "";
  let live: Live | null = null;
  let ended = false;
  let turnSeq = 0;
  let fillerIdx = 0;
  let lastIdleAt: number | null = null;
  let xpAwards = 0;
  const history: ChatMessage[] = [];
  const seen = new Set<string>();
  const seenOrder: string[] = [];
  let chain: Promise<void> = Promise.resolve();

  const send = (msg: CoworkServerMessage) => {
    if (closed) return;
    try {
      socket.send(JSON.stringify(msg));
    } catch {
      // Socket already gone; nothing to deliver to.
    }
  };

  const shut = (code: number, reason: string) => {
    if (closed) return;
    closed = true;
    if (live?.budgetTimer) clearTimeout(live.budgetTimer);
    try {
      socket.close(code, reason);
    } catch {
      // Already closed.
    }
  };

  const enqueue = (task: () => Promise<void>) => {
    chain = chain.then(task).catch((err) => ctx.log("cowork task failed", { error: String(err) }));
  };

  const rememberKey = (key: string): boolean => {
    if (seen.has(key)) return false;
    seen.add(key);
    seenOrder.push(key);
    if (seenOrder.length > MAX_KEYS) seen.delete(seenOrder.shift() as string);
    return true;
  };

  const pushHistory = (msg: ChatMessage) => {
    history.push(msg);
    if (history.length > HISTORY_MAX) history.splice(0, history.length - HISTORY_MAX);
  };

  const message = (role: ChatMessage["role"], text: string): ChatMessage => ({
    id: randomUUID(),
    role,
    text,
    at: new Date().toISOString(),
  });

  /** Load the objective fresh, apply a change, and persist it. Returns false when the objective is gone. */
  const mutateStage = (fn: (sp: StageProgress) => void): boolean => {
    if (!live || userId === null) return false;
    const objective = ctx.getObjective(userId, live.objectiveId);
    if (!objective) return false;
    const sp = ensureStageProgress(objective, live);
    fn(sp);
    ctx.saveObjective(userId, objective);
    return true;
  };

  const currentStage = (): StageProgress | null => {
    if (!live || userId === null) return null;
    const objective = ctx.getObjective(userId, live.objectiveId);
    if (!objective) return null;
    return ensureStageProgress(objective, live);
  };

  const endSession = (reason: "learner_ended" | "budget_exhausted" | "insufficient_credits" | "error", summary?: string) => {
    if (ended) return;
    ended = true;
    send({ type: "session_end", reason, ...(summary ? { summary } : {}) });
    shut(1000, reason);
  };

  const budgetExpired = () => live !== null && Date.now() - live.startedAt >= COWORK_BUDGET_MS;

  const runTurn = async (turn: Turn): Promise<void> => {
    if (!live || userId === null || ended || closed) return;
    if (budgetExpired()) {
      endSession("budget_exhausted");
      return;
    }

    let balance: number | null | undefined;
    if (turn.debit) {
      const r = ctx.debit(userId, "cowork_turn", "AI co-worker turn");
      if (!r.ok) {
        endSession("insufficient_credits");
        return;
      }
      balance = r.balance;
    }

    const turnId = `turn_${++turnSeq}_${randomUUID().slice(0, 8)}`;
    send({ type: "thinking", filler: COWORK_FILLERS[fillerIdx++ % COWORK_FILLERS.length] });

    const objective = ctx.getObjective(userId, live.objectiveId);
    const user: User | null = ctx.getUser(userId);
    const sp = objective ? ensureStageProgress(objective, live) : null;
    const tier: ModelTier = live.model ?? user?.settings.aiModel ?? "fast";

    try {
      let streamed = "";
      const result = await ctx.ai.coworkTurn({
        scenario: live.scenario,
        stage: live.stage,
        npc: live.npc,
        learnerName: live.learnerName,
        agreedRequirements: sp?.agreedRequirements ?? [],
        todos: (sp?.todos ?? []).map((t) => ({ ...t })),
        history: history.slice(-HISTORY_MAX),
        input: turn.input,
        screenshot: turn.screen?.screenshot,
        focusedApp: turn.screen?.focusedApp,
        windowTitle: turn.screen?.windowTitle,
        tier,
        onDelta: (delta) => {
          streamed += delta;
          send({ type: "text_delta", turn_id: turnId, delta });
        },
      });

      const text = result.text || streamed;
      send({ type: "text_response", turn_id: turnId, text });

      if (turn.learnerLine) pushHistory(message(turn.learnerLine.role, turn.learnerLine.text));
      pushHistory(message("npc", text));

      if (result.todos) {
        const items = result.todos;
        mutateStage((s) => {
          s.todos = items.map((t) => ({ id: t.id, text: t.text, done: t.done }));
        });
        send({ type: "todos", items: items as CoworkTodo[] });
      }
      if (result.highlight) send({ type: "highlight", rect: result.highlight.rect, label: result.highlight.label });
      if (result.resource) send({ type: "resource", ...result.resource });
      if (result.xp && xpAwards < MAX_XP_AWARDS) {
        xpAwards++;
        ctx.awardXp(userId, result.xp.amount, result.xp.reason, live.scenario.id, false);
        send({ type: "xp", amount: result.xp.amount, reason: result.xp.reason });
      }
      if (balance !== undefined) send({ type: "credits", balance });
    } catch (err) {
      ctx.log("cowork turn failed", { error: String(err) });
      send({ type: "text_response", turn_id: turnId, text: "Sorry, I lost my train of thought there. Could you ask me again?" });
    }
  };

  const handleInit = async (msg: Extract<CoworkClientMessage, { action: "init" }>) => {
    if (live) {
      send({ type: "error", code: "already_initialized", message: "This co-worker session is already started." });
      return;
    }
    if (userId === null) return;
    const objective: Objective | null = ctx.getObjective(userId, msg.objectiveId);
    if (!objective) {
      send({ type: "error", code: "not_found", message: "Objective not found." });
      return;
    }
    let content: ContentLookup;
    try {
      content = opts.content ?? (await defaultContent());
    } catch (err) {
      ctx.log("cowork content unavailable", { error: String(err) });
      send({ type: "error", code: "content_unavailable", message: "Content is unavailable right now." });
      return;
    }
    const scenario = content.getScenario(objective.scenarioId);
    const stage = content.findStage(objective.scenarioId, msg.stageId);
    const npc = scenario ? content.getNpc(scenario.npcId) : undefined;
    if (!scenario || !stage || !npc) {
      send({ type: "error", code: "not_found", message: "Stage not found." });
      return;
    }
    const user = ctx.getUser(userId);
    const learnerName = msg.learnerName?.trim() || user?.name || "there";
    live = {
      objectiveId: objective.id,
      stageId: stage.id,
      mode: msg.mode,
      model: msg.model,
      learnerName,
      scenario,
      stage,
      npc,
      startedAt: Date.now(),
      budgetTimer: null,
    };
    live.budgetTimer = setTimeout(() => endSession("budget_exhausted"), COWORK_BUDGET_MS);
    live.budgetTimer.unref?.();

    send({ type: "session_ready", npcName: npc.name, npcRole: npc.role, budgetMinutes: COWORK_BUDGET_MS / 60000, mode: msg.mode });
    await runTurn({ kind: "intro", input: { kind: "intro" }, debit: false, learnerLine: null });
  };

  const handleMessage = async (msg: ClientFrame): Promise<void> => {
    if (msg.action === "init") return handleInit(msg as Extract<CoworkClientMessage, { action: "init" }>);
    if (!live) {
      send({ type: "error", code: "not_initialized", message: "Send init before other actions." });
      return;
    }
    switch (msg.action) {
      case "user_text": {
        const m = msg as Extract<CoworkClientMessage, { action: "user_text" }>;
        const text = String(m.text ?? "").slice(0, 2000);
        if (!text.trim()) return;
        return runTurn({
          kind: "text",
          input: { kind: "text", text },
          debit: true,
          screen: pickScreen(m),
          learnerLine: { role: "learner", text },
        });
      }
      case "im_lost": {
        const m = msg as Extract<CoworkClientMessage, { action: "im_lost" }>;
        const question = String(m.question ?? "I'm lost").slice(0, 1000);
        return runTurn({
          kind: "im_lost",
          input: { kind: "im_lost", question },
          debit: true,
          screen: pickScreen(m),
          learnerLine: { role: "learner", text: question },
        });
      }
      case "request_highlight": {
        const m = msg as Extract<CoworkClientMessage, { action: "request_highlight" }>;
        const query = String(m.query ?? "").slice(0, 300);
        return runTurn({
          kind: "highlight",
          input: { kind: "highlight", query },
          debit: true,
          screen: pickScreen(m),
          learnerLine: { role: "learner", text: `Show me: ${query}` },
        });
      }
      case "user_event": {
        const m = msg as Extract<CoworkClientMessage, { action: "user_event" }>;
        // Only idle screen changes are processed (at most once per minute). Other events are acked only.
        if (m.kind !== "idle_screen_changed") return;
        if (lastIdleAt !== null && Date.now() - lastIdleAt < IDLE_THROTTLE_MS) return;
        lastIdleAt = Date.now();
        return runTurn({
          kind: "event",
          input: { kind: "event", event: m.kind },
          debit: true,
          screen: pickScreen(m),
          learnerLine: null,
        });
      }
      case "todo_complete": {
        const m = msg as Extract<CoworkClientMessage, { action: "todo_complete" }>;
        let found = false;
        mutateStage((sp) => {
          const todo = sp.todos.find((t) => t.id === m.todoId);
          if (todo) {
            todo.done = Boolean(m.done);
            found = true;
          }
        });
        if (found) {
          const sp = currentStage();
          if (sp) send({ type: "todos", items: sp.todos });
        }
        return;
      }
      case "audio_playback_done":
        return;
      case "end_session": {
        const sp = currentStage();
        const total = sp?.todos.length ?? 0;
        const done = sp?.todos.filter((t) => t.done).length ?? 0;
        const summary = `You worked on "${live.stage.title}" with ${live.npc.name} and finished ${done} of ${total} todos.`;
        endSession("learner_ended", summary);
        return;
      }
      default:
        send({ type: "error", code: "unknown_action", message: `Unknown action ${String(msg.action)}.` });
    }
  };

  const reject = () => {
    send({ type: "error", code: "unauthorized", message: "Authentication required." });
    shut(WS_UNAUTHORIZED, "unauthorized");
  };

  socket.on("message", (raw: unknown) => {
    if (closed) return;
    const msg = parseFrame(raw);

    if (authPromise === null) {
      if (!msg || msg.action !== "auth") {
        reject();
        return;
      }
      const auth = msg as unknown as { token?: unknown; session_id?: unknown };
      sessionId = typeof auth.session_id === "string" ? auth.session_id : randomUUID();
      authPromise = (async () => {
        try {
          const token = typeof auth.token === "string" ? auth.token : "";
          const verified = token ? await ctx.verifyToken(token) : null;
          if (!verified) {
            reject();
            return null;
          }
          userId = verified.userId;
          send({ type: "connection_registered", session_id: sessionId });
          return verified.userId;
        } catch {
          reject();
          return null;
        }
      })();
      return;
    }

    authPromise.then((uid) => {
      if (uid === null || closed || !msg) {
        if (uid !== null && !msg) send({ type: "error", code: "bad_request", message: "Frame is not valid JSON." });
        return;
      }
      if (msg.action === "ping") {
        send({ type: "pong" });
        return;
      }
      if (msg.action === "auth") return;
      const key = (msg as { event_key?: unknown }).event_key;
      if (typeof key !== "string" || key === "") {
        send({ type: "error", code: "bad_request", message: "event_key is required." });
        return;
      }
      send({ type: "ack", event_key: key });
      if (!rememberKey(key)) return;
      enqueue(() => handleMessage(msg));
    });
  });

  socket.on("close", () => {
    closed = true;
    if (live?.budgetTimer) clearTimeout(live.budgetTimer);
  });
}

function pickScreen(m: { screenshot?: string; focusedApp?: string; windowTitle?: string }) {
  return { screenshot: m.screenshot, focusedApp: m.focusedApp, windowTitle: m.windowTitle };
}

function ensureStageProgress(objective: Objective, live: Live): StageProgress {
  let sp = objective.stages[live.stageId];
  if (!sp) {
    sp = {
      stageId: live.stageId,
      status: "in_progress",
      mode: live.mode,
      agreedRequirements: [],
      estimatedMinutes: null,
      planComplete: false,
      planMessages: [],
      learnMessages: [],
      learnCompleted: [],
      todos: [],
      submissions: [],
      evaluation: null,
      startedAt: new Date().toISOString(),
      timeSpentSec: 0,
    };
    objective.stages[live.stageId] = sp;
  }
  return sp;
}
