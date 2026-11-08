// Cross-window message channels (pw.overlay.broadcast / onMessage) and overlay payload shapes.
// Shared contract between the main-window features (stage, presentation) and the overlay surfaces.
import type { CoworkTodo, NormRect, NpcVoice, StageMode } from "@pw/shared";

/** Payload for the "pip" (stage companion), "island" (co-worker dynamic island) and "cowork" (highlight canvas) overlays. */
export interface StageOverlayPayload {
  objectiveId: string;
  stageId: string;
  mode: StageMode;
  learnerName: string;
  /** Title strings so overlays can render before fetching. */
  stageTitle: string;
  scenarioTitle: string;
  npcName: string;
  npcAvatarSeed: string;
  /** The manager's voice, so the island speaks with the same natural voice as the kickoff. */
  npcVoice?: NpcVoice;
}

/** Payload for the "recordbar" and "camera" overlays during a presentation. */
export interface PresentationOverlayPayload {
  objectiveId: string;
  stageId: string;
  slides: number;
  cameraDeviceId?: string;
}

export interface OverlayChannelMap {
  /** island → cowork surface: draw a highlight (normalised screen rect). */
  "cowork:highlight": { rect: NormRect; label: string };
  /** island → everyone: co-worker status for mini displays (pip, stage page). */
  "cowork:state": { status: "connecting" | "listening" | "thinking" | "speaking" | "idle" | "ended"; lastText?: string; todos?: CoworkTodo[] };
  /** stage page / pip → island: start or stop the co-worker session. */
  "cowork:command": { cmd: "start" | "stop" | "im_lost"; question?: string; regions?: NormRect[] };
  /** anyone → region surface opener; region surface → island: "I'm lost" selection result. */
  "region:submit": { regions: NormRect[]; question: string };
  "region:cancel": Record<string, never>;
  /** anyone → hud: show a transient toast in the HUD overlay. */
  "hud:show": { title: string; body?: string; tone?: "neutral" | "success" | "xp" | "warning" | "danger" };
  /** presentation page → recordbar: current recording state. */
  "recordbar:state": { elapsedSec: number; paused: boolean; slide: number; slides: number; recording: boolean };
  /** recordbar → presentation page. */
  "recordbar:command": { cmd: "pause" | "resume" | "stop" | "next" | "prev" };
  /** camera bubble → presentation page: framing quality 0..1 and lighting verdict. */
  "camera:framing": { score: number; reason: "ok" | "too_dark" | "too_bright" | "no_signal" };
  /** pip → main: data changed (todos, submissions), refetch the objective. */
  "objective:changed": { objectiveId: string };
}

export type OverlayChannel = keyof OverlayChannelMap;
