import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/** Seconds of focused time sent in one POST. */
export const TIME_FLUSH_SEC = 60;
/** Remainders below this are dropped on unmount. */
const MIN_REMAINDER_SEC = 5;

/** True while this window is visible and focused. */
export function isPageActive(): boolean {
  return typeof document !== "undefined" && document.visibilityState === "visible" && document.hasFocus();
}

/** Reactive version of isPageActive, for the live stage timer. */
export function usePageActive(): boolean {
  const [active, setActive] = useState(isPageActive);
  useEffect(() => {
    const update = () => setActive(isPageActive());
    document.addEventListener("visibilitychange", update);
    window.addEventListener("focus", update);
    window.addEventListener("blur", update);
    return () => {
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
      window.removeEventListener("blur", update);
    };
  }, []);
  return active;
}

/**
 * Counts focused, visible seconds on a stage. Every TIME_FLUSH_SEC it posts that chunk, and on
 * unmount (or when the stage changes) it posts the remainder if it is at least 5 seconds.
 */
export function useStageTime(objectiveId: string, stageId: string, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    let pending = 0;
    const send = (seconds: number) => {
      if (seconds <= 0) return;
      api("POST /objectives/:id/time", { params: { id: objectiveId }, body: { seconds, stageId } }).catch(() => undefined);
    };
    const tick = window.setInterval(() => {
      if (!isPageActive()) return;
      pending += 1;
      if (pending >= TIME_FLUSH_SEC) {
        pending -= TIME_FLUSH_SEC;
        send(TIME_FLUSH_SEC);
      }
    }, 1000);
    return () => {
      window.clearInterval(tick);
      if (pending >= MIN_REMAINDER_SEC) send(pending);
    };
  }, [objectiveId, stageId, enabled]);
}
