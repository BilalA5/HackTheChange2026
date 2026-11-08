// OTA check: GET /api/ota/:channel. Runs at boot and every 6 h; a newer version triggers a native notification.
import { app } from "electron";
import { API_PREFIX, type OtaInfo } from "@pw/shared";
import { config } from "../config.ts";
import { log, errorMessage } from "../log.ts";
import { showNative } from "./nativeNotify.ts";

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
let lastNotified: string | null = null;

export async function checkForUpdates(token: string | null): Promise<OtaInfo> {
  const res = await fetch(`${config.serverUrl}${API_PREFIX}/ota/${encodeURIComponent(config.channel)}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`update check failed (${res.status})`);
  const info = (await res.json()) as OtaInfo;
  if (typeof info.version !== "string") throw new Error("update check returned no version");
  return info;
}

export function isNewer(candidate: string, current: string): boolean {
  const parse = (v: string) => v.split(/[.-]/).slice(0, 3).map((p) => Number.parseInt(p, 10) || 0);
  const a = parse(candidate);
  const b = parse(current);
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  }
  return false;
}

export function startUpdateSchedule(getToken: () => string | null): NodeJS.Timeout {
  const run = async () => {
    try {
      const info = await checkForUpdates(getToken());
      if (info.url && isNewer(info.version, app.getVersion()) && info.version !== lastNotified) {
        lastNotified = info.version;
        showNative({ title: "Proofwork update available", body: `Version ${info.version} is ready to install.` });
        log.info(`update available: ${info.version}`);
      }
    } catch (err) {
      log.warn(`update check skipped: ${errorMessage(err)}`);
    }
  };
  setTimeout(() => void run(), 5_000);
  return setInterval(() => void run(), SIX_HOURS_MS);
}

