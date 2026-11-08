/*
 * Per-device conveniences for the account panels. These are not server settings: they only change how
 * this browser or desktop build behaves, so localStorage is the right place. Every access is guarded.
 */

const INCLUDE_LOGS_KEY = "pw.bug.includeLogs";

/** Whether the bug reporter attaches recent app logs. Defaults to on. */
export function readIncludeLogs(): boolean {
  try {
    return localStorage.getItem(INCLUDE_LOGS_KEY) !== "0";
  } catch {
    return true;
  }
}

export function writeIncludeLogs(on: boolean): void {
  try {
    localStorage.setItem(INCLUDE_LOGS_KEY, on ? "1" : "0");
  } catch {
    /* storage unavailable: the preference simply does not persist */
  }
}
