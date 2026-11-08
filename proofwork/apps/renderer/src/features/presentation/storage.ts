/*
 * The recording URL survives the hop from the presentation page to the feedback page in this tab only.
 * It is a per-tab convenience, not durable state: the server keeps the evaluation.
 */

export function recordingStorageKey(objectiveId: string): string {
  return `pw.presentation.${objectiveId}`;
}

export function storeRecordingUrl(objectiveId: string, url: string | null): void {
  try {
    const key = recordingStorageKey(objectiveId);
    if (url) sessionStorage.setItem(key, url);
    else sessionStorage.removeItem(key);
  } catch {
    // Storage can be blocked. The feedback page then simply has no playback.
  }
}

export function readRecordingUrl(objectiveId: string): string | null {
  try {
    return sessionStorage.getItem(recordingStorageKey(objectiveId));
  } catch {
    return null;
  }
}
