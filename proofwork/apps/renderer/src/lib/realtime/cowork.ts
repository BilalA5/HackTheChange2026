import { useSyncExternalStore } from "react";
import {
  WS_PATHS,
  type CoworkClientMessage,
  type CoworkContext,
  type CoworkServerMessage,
  type CoworkTodo,
  type Id,
  type NormRect,
  type StageMode,
} from "@pw/shared";
import { pw } from "@/lib/bridge";
import { currentServerUrl } from "@/lib/api";
import { getDeviceId } from "@/lib/device";
import { newUuid } from "@/lib/uuid";
import { useSession } from "@/stores/session";
import { ReliableSocket, type SocketStatus } from "./ReliableSocket";
import type { DistOmit } from "./ReliableSocket";

/*
 * AI co-worker client (/ws/cowork). Wraps a ReliableSocket and folds server frames into a small store:
 *   - text_delta frames stream into one npc message per turn_id; text_response finalises it;
 *   - todos, highlight, resources, xp, credits, mode and session_end update their own fields.
 * Use createCoworkClient(), then useCowork(client) in React.
 */

export type CoworkClientAction = DistOmit<CoworkClientMessage, "event_key">;
export type CoworkUserEventKind = Extract<CoworkClientMessage, { action: "user_event" }>["kind"];

export interface CoworkMessage {
  id: string;
  role: "learner" | "npc" | "system";
  text: string;
  /** True while text_delta frames are still arriving for this turn. */
  streaming: boolean;
  at: number;
}

export interface CoworkState {
  connection: SocketStatus;
  ready: { npcName: string; npcRole: string; budgetMinutes: number; mode: StageMode } | null;
  mode: StageMode;
  messages: CoworkMessage[];
  todos: CoworkTodo[];
  thinking: boolean;
  thinkingFiller: string | null;
  lastHighlight: { rect: NormRect; label: string } | null;
  resources: { title: string; body: string; url?: string }[];
  /** XP granted during this session (sum of "xp" frames). */
  xpEarned: number;
  credits: { balance: number | null } | null;
  ended: { reason: string; summary?: string } | null;
  error: string | null;
}

export interface CoworkClientOptions {
  objectiveId: Id;
  stageId: Id;
  mode: StageMode;
  learnerName: string;
  model?: "quality" | "fast";
  /** Test seams. */
  WebSocketImpl?: typeof WebSocket;
  storage?: Storage | null;
  baseUrl?: () => string;
}

export interface CoworkClient {
  /** Opens the socket and sends the init frame (queued until registered). */
  connect(): void;
  /** Sends a learner utterance. Returns the event_key, which is also the learner message id. */
  sendText(text: string, ctx?: CoworkContext): string;
  /** Reports something the learner did. */
  sendEvent(kind: CoworkUserEventKind, ctx?: CoworkContext): string;
  /** "I'm lost": optionally with normalised regions the learner pointed at. */
  imLost(question: string, ctx?: CoworkContext & { regions?: NormRect[] }): string;
  /** Asks the co-worker to highlight something on screen. */
  requestHighlight(query: string, ctx?: CoworkContext): string;
  completeTodo(todoId: Id, done: boolean): string;
  /** Tells the server the spoken reply finished playing. */
  audioPlaybackDone(): string;
  end(): string;
  /** Closes the socket for good. */
  close(): void;
  /** Typed subscription to server frames. */
  on<K extends CoworkServerMessage["type"]>(
    type: K,
    cb: (msg: Extract<CoworkServerMessage, { type: K }>) => void,
  ): () => void;
  getState(): CoworkState;
  subscribe(cb: () => void): () => void;
}

export function initialCoworkState(mode: StageMode): CoworkState {
  return {
    connection: "closed",
    ready: null,
    mode,
    messages: [],
    todos: [],
    thinking: false,
    thinkingFiller: null,
    lastHighlight: null,
    resources: [],
    xpEarned: 0,
    credits: null,
    ended: null,
    error: null,
  };
}

/** Pure reducer for server frames. Exported for tests. */
export function reduceCoworkMessage(state: CoworkState, msg: CoworkServerMessage, now = Date.now()): CoworkState {
  switch (msg.type) {
    case "session_ready":
      return { ...state, ready: { npcName: msg.npcName, npcRole: msg.npcRole, budgetMinutes: msg.budgetMinutes, mode: msg.mode }, mode: msg.mode };
    case "thinking":
      return { ...state, thinking: true, thinkingFiller: msg.filler ?? null };
    case "text_delta": {
      const exists = state.messages.some((m) => m.id === msg.turn_id);
      const messages = exists
        ? state.messages.map((m) => (m.id === msg.turn_id ? { ...m, text: m.text + msg.delta, streaming: true } : m))
        : [...state.messages, { id: msg.turn_id, role: "npc" as const, text: msg.delta, streaming: true, at: now }];
      return { ...state, messages, thinking: false };
    }
    case "text_response": {
      const exists = state.messages.some((m) => m.id === msg.turn_id);
      const messages = exists
        ? state.messages.map((m) => (m.id === msg.turn_id ? { ...m, text: msg.text, streaming: false } : m))
        : [...state.messages, { id: msg.turn_id, role: "npc" as const, text: msg.text, streaming: false, at: now }];
      return { ...state, messages, thinking: false };
    }
    case "todos":
      return { ...state, todos: msg.items };
    case "highlight":
      return { ...state, lastHighlight: { rect: msg.rect, label: msg.label } };
    case "resource":
      return { ...state, resources: [...state.resources, { title: msg.title, body: msg.body, url: msg.url }] };
    case "xp":
      return { ...state, xpEarned: state.xpEarned + msg.amount };
    case "mode_change":
      return { ...state, mode: msg.mode };
    case "credits":
      return { ...state, credits: { balance: msg.balance } };
    case "session_end":
      return { ...state, thinking: false, ended: { reason: msg.reason, summary: msg.summary } };
    case "error":
      return { ...state, error: msg.message };
    case "connection_registered":
    case "ack":
    case "pong":
    case "screen_capture_request":
      return state;
  }
}

/** Screenshot plus focus info for a turn. Returns {} when capture is unavailable (web build, permission denied). */
export async function captureContext(): Promise<CoworkContext> {
  try {
    const shot = await pw.capture.screenshot({ maxWidth: 1280 });
    return { screenshot: shot.dataUrl, focusedApp: shot.focusedApp, windowTitle: shot.windowTitle };
  } catch {
    return {};
  }
}

export function createCoworkClient(opts: CoworkClientOptions): CoworkClient {
  let state = initialCoworkState(opts.mode);
  const subs = new Set<() => void>();
  const setState = (next: CoworkState) => {
    state = next;
    subs.forEach((cb) => cb());
  };

  const sessionId = newUuid();
  const socket = new ReliableSocket<CoworkServerMessage, CoworkClientAction>({
    name: "cowork",
    path: WS_PATHS.cowork,
    baseUrl: opts.baseUrl ?? (() => currentServerUrl()),
    auth: () => ({
      token: useSession.getState().token ?? "",
      session_id: sessionId,
      device_id: getDeviceId(),
    }),
    storage: opts.storage,
    WebSocketImpl: opts.WebSocketImpl,
  });

  socket.onStatus((connection) => setState({ ...state, connection }));

  // Every server frame goes through the reducer. Frames that need a reply are handled here as well.
  const frameTypes: CoworkServerMessage["type"][] = [
    "session_ready",
    "thinking",
    "text_delta",
    "text_response",
    "todos",
    "highlight",
    "resource",
    "xp",
    "mode_change",
    "credits",
    "session_end",
    "error",
    "screen_capture_request",
  ];
  for (const type of frameTypes) {
    socket.on(type, (msg) => {
      const frame = msg as CoworkServerMessage;
      setState(reduceCoworkMessage(state, frame));
      if (frame.type === "screen_capture_request") {
        void captureContext().then((ctx) => {
          socket.send({ action: "user_event", kind: "idle_screen_changed", ...ctx });
        });
      }
    });
  }

  const sendAndRecord = (frame: CoworkClientAction, learnerText?: string): string => {
    const key = socket.send(frame);
    if (learnerText !== undefined) {
      setState({
        ...state,
        messages: [...state.messages, { id: key, role: "learner", text: learnerText, streaming: false, at: Date.now() }],
      });
    }
    return key;
  };

  return {
    connect() {
      socket.connect();
      socket.send({
        action: "init",
        objectiveId: opts.objectiveId,
        stageId: opts.stageId,
        mode: opts.mode,
        learnerName: opts.learnerName,
        model: opts.model,
      });
    },
    sendText(text, ctx) {
      return sendAndRecord({ action: "user_text", text, ...ctx }, text);
    },
    sendEvent(kind, ctx) {
      return sendAndRecord({ action: "user_event", kind, ...ctx });
    },
    imLost(question, ctx) {
      return sendAndRecord({ action: "im_lost", question, ...ctx });
    },
    requestHighlight(query, ctx) {
      return sendAndRecord({ action: "request_highlight", query, ...ctx });
    },
    completeTodo(todoId, done) {
      return sendAndRecord({ action: "todo_complete", todoId, done });
    },
    audioPlaybackDone() {
      return sendAndRecord({ action: "audio_playback_done" });
    },
    end() {
      return sendAndRecord({ action: "end_session" });
    },
    close() {
      socket.close();
    },
    on(type, cb) {
      return socket.on(type, cb);
    },
    getState() {
      return state;
    },
    subscribe(cb) {
      subs.add(cb);
      return () => subs.delete(cb);
    },
  };
}

/** React binding for a cowork client. Re-renders on every state change. */
export function useCowork(client: CoworkClient): CoworkState {
  return useSyncExternalStore(client.subscribe, client.getState, client.getState);
}
