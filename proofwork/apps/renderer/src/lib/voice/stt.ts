import type { PermissionStatus, Unsubscribe } from "@pw/shared";
import { pw } from "@/lib/bridge";
import { newUuid } from "@/lib/uuid";
import { startMic, type MicHandle } from "./mic";

/*
 * On-device speech recognition through pw.stt (native helper, macOS only).
 * In the web build probeStt() reports available:false and callers show a typed fallback.
 */

export interface SttStatus {
  available: boolean;
  reason?: string;
  permission: PermissionStatus;
}

export async function probeStt(): Promise<SttStatus> {
  try {
    return await pw.stt.status();
  } catch {
    return { available: false, reason: "error", permission: "unknown" };
  }
}

export interface SttTurnOptions {
  vocabulary?: string[];
  deviceId?: string;
  onPartial?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (message: string) => void;
  onLevel?: (level: number) => void;
}

export interface SttTurn {
  turnId: string;
  /** Stops the microphone and asks the helper to finalise. onFinal still fires once the final text arrives. */
  stop(): Promise<void>;
}

/** Starts one recognition turn: the helper gets the turn id, the mic PCM goes to pw.stt.pushAudio. */
export async function startSttTurn(opts: SttTurnOptions): Promise<SttTurn> {
  const turnId = newUuid();
  let finished = false;
  let mic: MicHandle | null = null;

  const unsub: Unsubscribe = pw.stt.onEvent((e) => {
    if (finished) return;
    switch (e.type) {
      case "partial":
        if (e.turnId === turnId) opts.onPartial?.(e.text);
        break;
      case "final":
        if (e.turnId === turnId) {
          finished = true;
          unsub();
          opts.onFinal(e.text);
        }
        break;
      case "error":
        if (e.turnId === turnId || e.turnId === null) opts.onError?.(e.message);
        break;
      case "status":
        break;
    }
  });

  try {
    await pw.stt.start(turnId, opts.vocabulary);
    mic = await startMic({
      deviceId: opts.deviceId,
      onLevel: opts.onLevel,
      onPcm: (chunk) => pw.stt.pushAudio(chunk),
    });
  } catch (err) {
    unsub();
    mic?.stop();
    throw err;
  }

  return {
    turnId,
    async stop() {
      mic?.stop();
      mic = null;
      await pw.stt.stop();
    },
  };
}
