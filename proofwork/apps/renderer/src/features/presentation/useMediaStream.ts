import { useCallback, useEffect, useState } from "react";

export type MediaStatus = "idle" | "requesting" | "ready" | "denied" | "not_found" | "error";

export interface MediaPrefs {
  cameraId?: string;
  micId?: string;
}

export interface MediaDeviceChoice {
  deviceId: string;
  label: string;
}

export interface MediaDeviceLists {
  cameras: MediaDeviceChoice[];
  mics: MediaDeviceChoice[];
}

export interface MediaError {
  status: "denied" | "not_found" | "error";
  message: string;
}

/** Maps a getUserMedia failure to a status the UI can show. Pure, so it can be tested. */
export function describeMediaError(e: unknown): MediaError {
  const name = e instanceof DOMException || e instanceof Error ? e.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return {
        status: "denied",
        message: "Camera or microphone access is blocked. Allow both for Proofwork, then retry.",
      };
    case "NotFoundError":
    case "OverconstrainedError":
      return {
        status: "not_found",
        message: "The selected camera or microphone is not available. Pick another device, then retry.",
      };
    default:
      return { status: "error", message: "Could not start the camera or microphone. Retry, or restart the app." };
  }
}

/** Groups enumerated devices into camera and mic choices. Labels are empty until permission is granted. */
export function groupDevices(devices: readonly MediaDeviceInfo[]): MediaDeviceLists {
  const cameras: MediaDeviceChoice[] = [];
  const mics: MediaDeviceChoice[] = [];
  let camN = 0;
  let micN = 0;
  for (const d of devices) {
    if (d.kind === "videoinput") {
      camN += 1;
      cameras.push({ deviceId: d.deviceId, label: d.label || `Camera ${camN}` });
    } else if (d.kind === "audioinput") {
      micN += 1;
      mics.push({ deviceId: d.deviceId, label: d.label || `Microphone ${micN}` });
    }
  }
  return { cameras, mics };
}

export function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((t) => t.stop());
}

export interface MediaStreamState {
  status: MediaStatus;
  stream: MediaStream | null;
  error: string | null;
  devices: MediaDeviceLists;
  retry(): void;
}

/**
 * Camera and microphone stream for the presentation. Acquired while `enabled`, and every track is stopped
 * when `enabled` turns off or the component unmounts.
 */
export function useMediaStream(enabled: boolean, prefs: MediaPrefs): MediaStreamState {
  const [status, setStatus] = useState<MediaStatus>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [devices, setDevices] = useState<MediaDeviceLists>({ cameras: [], mics: [] });
  const { cameraId, micId } = prefs;

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      setStream(null);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setError("This device cannot access the camera here. Use the desktop app.");
      return;
    }

    let cancelled = false;
    let acquired: MediaStream | null = null;
    setStatus("requesting");
    setError(null);

    const refreshDevices = async () => {
      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) setDevices(groupDevices(list));
      } catch {
        // Device lists are a convenience. The stream still works without them.
      }
    };

    navigator.mediaDevices
      .getUserMedia({
        video: cameraId ? { deviceId: { ideal: cameraId } } : true,
        audio: micId
          ? { deviceId: { ideal: micId }, echoCancellation: true, noiseSuppression: true }
          : { echoCancellation: true, noiseSuppression: true },
      })
      .then(async (s) => {
        if (cancelled) {
          stopStream(s);
          return;
        }
        acquired = s;
        setStream(s);
        setStatus("ready");
        await refreshDevices();
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const d = describeMediaError(e);
        setStatus(d.status);
        setError(d.message);
      });

    const onChange = () => void refreshDevices();
    navigator.mediaDevices.addEventListener?.("devicechange", onChange);

    return () => {
      cancelled = true;
      navigator.mediaDevices.removeEventListener?.("devicechange", onChange);
      stopStream(acquired);
      setStream(null);
    };
  }, [enabled, cameraId, micId, attempt]);

  return { status, stream: enabled ? stream : null, error, devices, retry };
}
