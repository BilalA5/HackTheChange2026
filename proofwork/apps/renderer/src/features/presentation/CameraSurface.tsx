import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { pw } from "@/lib/bridge";
import { ringToneFor } from "./framing";
import { LiveVideo } from "./LiveVideo";
import { parsePresentationPayload } from "./overlayLink";
import { useMediaStream } from "./useMediaStream";
import { useFramingCheck } from "./useSignals";
import type { FramingReason } from "./types";
import "./overlay.css";

const RING_CLASS: Record<ReturnType<typeof ringToneFor>, string> = {
  success: "border-success",
  warning: "border-warning",
  danger: "border-danger",
  neutral: "border-white/20",
};

const REPORT_MS = 1000;

/**
 * Camera bubble overlay (240x240, transparent). Round video with a framing ring from the lighting check.
 * Broadcasts "camera:framing" every second. The whole bubble is a drag region.
 */
export default function CameraSurface() {
  const [cameraDeviceId, setCameraDeviceId] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    pw.overlay
      .getPayload()
      .then((p) => {
        if (!alive) return;
        setCameraDeviceId(parsePresentationPayload(p)?.cameraDeviceId);
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const media = useMediaStream(ready, { cameraId: cameraDeviceId });

  const counts = useRef({ ok: 0, total: 0 });
  const verdict = useFramingCheck(media.stream, (reason: FramingReason) => {
    counts.current.total += 1;
    if (reason === "ok") counts.current.ok += 1;
  });

  const reasonRef = useRef(verdict.reason);
  useEffect(() => {
    reasonRef.current = verdict.reason;
  });

  useEffect(() => {
    const id = setInterval(() => {
      const reason = reasonRef.current;
      if (!reason) return;
      const { ok, total } = counts.current;
      pw.overlay.broadcast("camera:framing", { score: total > 0 ? ok / total : 0, reason });
    }, REPORT_MS);
    return () => clearInterval(id);
  }, []);

  const tone = ringToneFor(verdict.reason);
  const waiting = media.status === "requesting" || media.status === "idle";

  return (
    <div className="pw-drag flex h-full w-full items-center justify-center">
      <div
        role="img"
        aria-label={`Camera preview, ${verdict.reason ?? "waiting"}`}
        className={cn(
          "relative size-[220px] overflow-hidden rounded-full border-[5px] bg-night-2 transition-colors duration-200",
          RING_CLASS[tone],
        )}
      >
        {media.stream ? (
          <LiveVideo stream={media.stream} label="Your camera" />
        ) : (
          <div className="grid h-full place-items-center px-6 text-center text-[12px] text-muted-dark">
            {waiting ? "Starting camera" : media.error ?? "No camera"}
          </div>
        )}
      </div>
    </div>
  );
}
