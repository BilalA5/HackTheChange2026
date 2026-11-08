import type { CoworkStatus } from "./overlayMessages";

/*
 * Island status: one label and one dot colour per state. The same status is broadcast as
 * "cowork:state", so the pip and the stage page show exactly what the island shows.
 */

export interface IslandSignals {
  /** A co-worker session has been started (island has a client). */
  started: boolean;
  /** The socket is open. */
  connected: boolean;
  listening: boolean;
  thinking: boolean;
  speaking: boolean;
  ended: boolean;
}

/** Priority: ended, listening, speaking, thinking, connecting, idle. */
export function deriveIslandStatus(s: IslandSignals): CoworkStatus {
  if (s.ended) return "ended";
  if (s.listening) return "listening";
  if (s.speaking) return "speaking";
  if (s.thinking) return "thinking";
  if (s.started && !s.connected) return "connecting";
  return "idle";
}

export const STATUS_LABEL: Record<CoworkStatus, string> = {
  connecting: "Connecting…",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking",
  idle: "Ready",
  ended: "Ended",
};

/** Dot colour, as a Tailwind background class from the theme tokens. */
export const STATUS_DOT: Record<CoworkStatus, string> = {
  connecting: "bg-fg-muted",
  listening: "bg-danger",
  thinking: "bg-warning",
  speaking: "bg-accent",
  idle: "bg-success",
  ended: "bg-fg-muted",
};

export const ISLAND_COLLAPSED = { width: 460, height: 120 } as const;
export const ISLAND_EXPANDED = { width: 460, height: 300 } as const;

/** The island opens while hovered or while the co-worker is speaking. */
export function shouldExpand(hovered: boolean, speaking: boolean): boolean {
  return hovered || speaking;
}
