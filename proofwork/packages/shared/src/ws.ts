// WebSocket protocols. Both sockets use the same "reliable socket" envelope:
//
// 1. Client opens ws://<server>/ws/<name>?session_id=…&device_id=…
// 2. FIRST frame must be  {action:"auth", token, session_id, device_id}
//    Server replies       {type:"connection_registered", session_id}
//    or                   {type:"error", code:"unauthorized"} and closes (4401).
// 3. Every later client frame carries a client-generated `event_key` (uuid). The server
//    de-duplicates by event_key (replays are ignored but still acked) and replies {type:"ack", event_key}.
//    The client keeps an outbox in localStorage under `<path>_events_queue`, replays un-acked frames
//    on reconnect, MAX_TRY = 3.
// 4. Heartbeat: client sends {action:"ping"} every 15 s; server answers {type:"pong"}.
//    No inbound frame for 40 s → client force-reconnects with exponential back-off (500 ms … 30 s).
import type { Id, NotificationItem, StageMode } from "./domain.ts";

export const RELIABLE_SOCKET = {
  MAX_TRY: 3,
  PING_INTERVAL_MS: 15_000,
  STALE_AFTER_MS: 40_000,
  BACKOFF_BASE_MS: 500,
  BACKOFF_MAX_MS: 30_000,
} as const;

export interface AuthFrame {
  action: "auth";
  token: string;
  session_id: string;
  device_id: string;
}
export interface PingFrame {
  action: "ping";
}

// ───────────────────────── /ws/cowork — the AI co-worker ─────────────────────────

/** Rectangle in normalised screen coordinates (0..1 of the screenshot). */
export interface NormRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CoworkTodo {
  id: Id;
  text: string;
  done: boolean;
}

export interface CoworkContext {
  /** PNG/JPEG data URL of the learner's screen at the moment of the turn (downscaled ≤ 1280 px). */
  screenshot?: string;
  focusedApp?: string;
  windowTitle?: string;
}

export type CoworkClientMessage = { event_key: string } & (
  | { action: "init"; objectiveId: Id; stageId: Id; mode: StageMode; learnerName: string; model?: "quality" | "fast" }
  | ({ action: "user_text"; text: string } & CoworkContext)
  | ({ action: "user_event"; kind: "idle_screen_changed" | "app_switched" | "stuck" } & CoworkContext)
  | ({ action: "im_lost"; question: string; regions?: NormRect[] } & CoworkContext)
  | ({ action: "request_highlight"; query: string } & CoworkContext)
  | { action: "todo_complete"; todoId: Id; done: boolean }
  | { action: "audio_playback_done" }
  | { action: "end_session" }
);

export type CoworkServerMessage =
  | { type: "connection_registered"; session_id: string }
  | { type: "ack"; event_key: string }
  | { type: "pong" }
  | { type: "error"; code: string; message: string }
  /** Sent once after init. */
  | { type: "session_ready"; npcName: string; npcRole: string; budgetMinutes: number; mode: StageMode }
  /** The agent is working (show filler / spinner). */
  | { type: "thinking"; filler?: string }
  /** Streaming text from the agent; concatenate deltas until text_response with same turn_id. */
  | { type: "text_delta"; turn_id: string; delta: string }
  /** Final text for a turn (also spoken via TTS on the client). */
  | { type: "text_response"; turn_id: string; text: string }
  | { type: "todos"; items: CoworkTodo[] }
  /** Point at something on the learner's screen. */
  | { type: "highlight"; rect: NormRect; label: string }
  | { type: "resource"; title: string; body: string; url?: string }
  | { type: "xp"; amount: number; reason: string }
  | { type: "mode_change"; mode: StageMode }
  /** Server asks the client to capture a fresh screenshot and send it with a user_event. */
  | { type: "screen_capture_request"; reason: string }
  /** Credits remaining after this turn (null = unlimited). */
  | { type: "credits"; balance: number | null }
  | { type: "session_end"; reason: "learner_ended" | "budget_exhausted" | "insufficient_credits" | "error"; summary?: string };

// ───────────────────────── /ws/notifications — main-process service ─────────────────────────

export type NotificationsServerMessage =
  | { type: "connection_registered"; session_id: string }
  | { type: "pong" }
  | { type: "notification"; item: NotificationItem }
  /** A short coaching nudge shown in the island overlay. */
  | { type: "coach_moment"; text: string }
  | { type: "credits"; balance: number | null }
  | { type: "xp"; amount: number; reason: string; total: number; level: number };
