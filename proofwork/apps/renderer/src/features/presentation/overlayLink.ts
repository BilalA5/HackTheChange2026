import { useEffect, useRef } from "react";
import { pw } from "@/lib/bridge";
import type { OverlayChannelMap, PresentationOverlayPayload } from "@/lib/overlayChannels";

/** Payload of "recordbar:state" (broadcast every second while recording). */
export type RecordBarState = OverlayChannelMap["recordbar:state"];
/** Payload of "recordbar:command" (sent by the record bar buttons). */
export type RecordBarCommand = OverlayChannelMap["recordbar:command"]["cmd"];
/** Payload of "camera:framing" (sent by the camera bubble every second). */
export type CameraFraming = OverlayChannelMap["camera:framing"];

const COMMANDS: readonly RecordBarCommand[] = ["pause", "resume", "stop", "next", "prev"];
const REASONS: readonly CameraFraming["reason"][] = ["ok", "too_dark", "too_bright", "no_signal"];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Narrows an untrusted overlay message to a record bar command. */
export function parseRecordBarCommand(data: unknown): RecordBarCommand | null {
  if (!isRecord(data)) return null;
  const cmd = data.cmd;
  return typeof cmd === "string" && (COMMANDS as readonly string[]).includes(cmd) ? (cmd as RecordBarCommand) : null;
}

/** Narrows an untrusted overlay message to a record bar state. */
export function parseRecordBarState(data: unknown): RecordBarState | null {
  if (!isRecord(data)) return null;
  const { elapsedSec, paused, slide, slides, recording } = data;
  if (
    typeof elapsedSec !== "number" ||
    typeof paused !== "boolean" ||
    typeof slide !== "number" ||
    typeof slides !== "number" ||
    typeof recording !== "boolean"
  ) {
    return null;
  }
  return { elapsedSec, paused, slide, slides, recording };
}

/** Narrows an untrusted overlay message to a camera framing report. */
export function parseCameraFraming(data: unknown): CameraFraming | null {
  if (!isRecord(data)) return null;
  const { score, reason } = data;
  if (typeof score !== "number" || typeof reason !== "string") return null;
  if (!(REASONS as readonly string[]).includes(reason)) return null;
  return { score: Math.min(1, Math.max(0, score)), reason: reason as CameraFraming["reason"] };
}

export interface OverlayLinkOptions {
  /** True while the overlays are open (Electron, recording). Gates the once-a-second state broadcast. */
  open: boolean;
  /** Current record bar state, read at each broadcast. */
  readState(): RecordBarState;
  onCommand(cmd: RecordBarCommand): void;
  onFraming(f: CameraFraming): void;
}

/**
 * Connects the presentation page to the record bar and camera overlay windows: broadcasts the record bar
 * state every second, and receives commands and framing reports.
 */
export function useOverlayLink(opts: OverlayLinkOptions): void {
  const latest = useRef(opts);
  useEffect(() => {
    latest.current = opts;
  });

  const { open } = opts;

  useEffect(() => {
    const off = pw.overlay.onMessage((msg) => {
      if (msg.channel === "recordbar:command") {
        const cmd = parseRecordBarCommand(msg.data);
        if (cmd) latest.current.onCommand(cmd);
      } else if (msg.channel === "camera:framing") {
        const f = parseCameraFraming(msg.data);
        if (f) latest.current.onFraming(f);
      }
    });
    return off;
  }, []);

  useEffect(() => {
    if (!open) return;
    const send = () => pw.overlay.broadcast("recordbar:state", latest.current.readState());
    send();
    const id = setInterval(send, 1000);
    return () => clearInterval(id);
  }, [open]);
}

/** Narrows the presentation overlay payload read with pw.overlay.getPayload(). */
export function parsePresentationPayload(data: unknown): PresentationOverlayPayload | null {
  if (!isRecord(data)) return null;
  const { objectiveId, stageId, slides, cameraDeviceId } = data;
  if (typeof objectiveId !== "string" || typeof stageId !== "string" || typeof slides !== "number") return null;
  return {
    objectiveId,
    stageId,
    slides,
    cameraDeviceId: typeof cameraDeviceId === "string" ? cameraDeviceId : undefined,
  };
}
