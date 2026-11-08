import { useCallback, useState } from "react";

/** Playback speeds offered in the kickoff meeting. */
export const SPEEDS = [1, 1.25, 1.5] as const;
export type Speed = (typeof SPEEDS)[number];

const SPEED_KEY = "pw.meeting.speed";
const CAPTIONS_KEY = "pw.meeting.captions";

export function parseSpeed(raw: string | null): Speed {
  const n = Number(raw);
  return (SPEEDS as readonly number[]).includes(n) ? (n as Speed) : 1;
}

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked (private windows). The preference then lasts for this screen only.
  }
}

export interface MeetingPrefs {
  speed: Speed;
  captions: boolean;
  setSpeed(next: Speed): void;
  setCaptions(on: boolean): void;
}

/** Kickoff playback preferences, persisted to localStorage under pw.meeting.speed and pw.meeting.captions. */
export function useMeetingPrefs(): MeetingPrefs {
  const [speed, setSpeedState] = useState<Speed>(() => parseSpeed(readStored(SPEED_KEY)));
  const [captions, setCaptionsState] = useState<boolean>(() => readStored(CAPTIONS_KEY) !== "off");

  const setSpeed = useCallback((next: Speed) => {
    setSpeedState(next);
    writeStored(SPEED_KEY, String(next));
  }, []);

  const setCaptions = useCallback((on: boolean) => {
    setCaptionsState(on);
    writeStored(CAPTIONS_KEY, on ? "on" : "off");
  }, []);

  return { speed, captions, setSpeed, setCaptions };
}
