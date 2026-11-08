import { newUuid } from "./uuid";

const KEY = "pw.device_id";

/** Stable per-browser (or per-install) id sent with socket auth frames. */
export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const id = newUuid();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return newUuid();
  }
}
