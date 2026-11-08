import type { CoworkTodo, NormRect, StageMode } from "@pw/shared";
import type { OverlayChannelMap, StageOverlayPayload } from "@/lib/overlayChannels";

/*
 * Runtime guards for every payload and message the overlays accept. Anything from another window is
 * untrusted until it passes one of these. Each parser returns null for anything it does not recognise.
 */

export type HudTone = NonNullable<OverlayChannelMap["hud:show"]["tone"]>;
export type CoworkStatus = OverlayChannelMap["cowork:state"]["status"];
export type CoworkCommand = OverlayChannelMap["cowork:command"];
export type RegionSubmit = OverlayChannelMap["region:submit"];

export interface HudInput {
  title: string;
  body?: string;
  tone?: HudTone;
}

export interface HighlightInput {
  rect: NormRect;
  label: string;
}

export interface CoworkStateInput {
  status: CoworkStatus;
  lastText?: string;
  todos?: CoworkTodo[];
}

const HUD_TONES: readonly HudTone[] = ["neutral", "success", "xp", "warning", "danger"];
const COWORK_STATUSES: readonly CoworkStatus[] = ["connecting", "listening", "thinking", "speaking", "idle", "ended"];
const COWORK_COMMANDS: readonly CoworkCommand["cmd"][] = ["start", "stop", "im_lost"];
const STAGE_MODES: readonly StageMode[] = ["plan", "do", "learn"];

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function oneOf<T extends string>(list: readonly T[], v: unknown): v is T {
  return typeof v === "string" && (list as readonly string[]).includes(v);
}

export function isNormRect(v: unknown): v is NormRect {
  return isRecord(v) && isFiniteNumber(v.x) && isFiniteNumber(v.y) && isFiniteNumber(v.w) && isFiniteNumber(v.h);
}

export function isStageOverlayPayload(v: unknown): v is StageOverlayPayload {
  if (!isRecord(v)) return false;
  const strings = [v.objectiveId, v.stageId, v.learnerName, v.stageTitle, v.scenarioTitle, v.npcName, v.npcAvatarSeed];
  return strings.every((s) => typeof s === "string") && oneOf(STAGE_MODES, v.mode);
}

export function parseRegionSubmit(v: unknown): RegionSubmit | null {
  if (!isRecord(v) || !Array.isArray(v.regions) || typeof v.question !== "string") return null;
  return { regions: v.regions.filter(isNormRect), question: v.question };
}

export function parseCoworkCommand(v: unknown): CoworkCommand | null {
  if (!isRecord(v) || !oneOf(COWORK_COMMANDS, v.cmd)) return null;
  const out: CoworkCommand = { cmd: v.cmd };
  if (typeof v.question === "string") out.question = v.question;
  if (Array.isArray(v.regions)) out.regions = v.regions.filter(isNormRect);
  return out;
}

export function parseHighlight(v: unknown): HighlightInput | null {
  if (!isRecord(v) || !isNormRect(v.rect) || typeof v.label !== "string") return null;
  return { rect: v.rect, label: v.label };
}

export function parseCoworkState(v: unknown): CoworkStateInput | null {
  if (!isRecord(v) || !oneOf(COWORK_STATUSES, v.status)) return null;
  const out: CoworkStateInput = { status: v.status };
  if (typeof v.lastText === "string") out.lastText = v.lastText;
  if (Array.isArray(v.todos)) {
    out.todos = v.todos.filter(
      (t): t is CoworkTodo => isRecord(t) && typeof t.id === "string" && typeof t.text === "string" && typeof t.done === "boolean",
    );
  }
  return out;
}

export function parseHudShow(v: unknown): HudInput | null {
  if (!isRecord(v) || typeof v.title !== "string") return null;
  const out: HudInput = { title: v.title };
  if (typeof v.body === "string") out.body = v.body;
  if (oneOf(HUD_TONES, v.tone)) out.tone = v.tone;
  return out;
}

/**
 * Maps a notifications-socket push to a HUD notice. Only "xp" and "notification" frames show a toast.
 * xp reads "+N XP · reason"; a notification shows its title.
 */
export function hudNoticeFromPush(msg: { type: string; [k: string]: unknown }): HudInput | null {
  if (msg.type === "xp") {
    const amount = msg.amount;
    if (!isFiniteNumber(amount)) return null;
    const reason = typeof msg.reason === "string" && msg.reason.trim() ? msg.reason.trim() : null;
    return { title: reason ? `+${amount} XP · ${reason}` : `+${amount} XP`, tone: "xp" };
  }
  if (msg.type === "notification") {
    const item = msg.item;
    if (!isRecord(item) || typeof item.title !== "string") return null;
    const out: HudInput = { title: item.title, tone: "neutral" };
    if (typeof item.body === "string") out.body = item.body;
    return out;
  }
  return null;
}
