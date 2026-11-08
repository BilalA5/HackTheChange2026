// Smoke mode (`electron . --smoke`): same boot, hidden windows, prints one JSON line on stdout and exits 0/1.
import { app, type WebContents } from "electron";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { User, PermissionStatus } from "@pw/shared";
import { config } from "./config.ts";
import { log, errorMessage } from "./log.ts";
import { AuthStore } from "./services/authStore.ts";
import type { Services } from "./ipc/register.ts";
import { OVERLAY_KINDS, ensureOverlay } from "./windows/overlays.ts";
import { state } from "./windows/registry.ts";

export interface SmokeContext {
  services: Services;
  userData: string;
  prodServerUrl: string | null;
  prodServerError: string | null;
}

const TIMEOUT_MS = 25_000;

function waitLoaded(wc: WebContents): Promise<void> {
  if (!wc.isLoading()) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      wc.removeListener("did-finish-load", done);
      wc.removeListener("did-fail-load", done);
      resolve();
    };
    const timer = setTimeout(done, 10_000);
    wc.once("did-finish-load", done);
    wc.once("did-fail-load", done);
  });
}

async function hasBridge(wc: WebContents): Promise<boolean> {
  try {
    return (await wc.executeJavaScript("typeof window.pw === 'object' && window.pw !== null")) === true;
  } catch {
    return false;
  }
}

export async function runSmoke(ctx: SmokeContext): Promise<void> {
  const started = Date.now();
  const failures: string[] = [];
  let finished = false;

  const finish = (code: number, out: Record<string, unknown>) => {
    if (finished) return;
    finished = true;
    const line = JSON.stringify({ smoke: { ...out, ok: code === 0, failures, durationMs: Date.now() - started } });
    process.stdout.write(`${line}\n`, () => app.exit(code));
  };

  const watchdog = setTimeout(() => {
    failures.push("timeout");
    finish(1, {});
  }, TIMEOUT_MS);

  try {
    // Windows: app view, shell and every overlay kind must expose window.pw.
    const targets: [string, WebContents | null][] = [];
    targets.push(["main", state.appView?.webContents ?? null]);
    targets.push(["shell", state.main?.webContents ?? null]);
    for (const kind of OVERLAY_KINDS) targets.push([kind, ensureOverlay(kind).webContents]);
    const windows: Record<string, boolean> = {};
    for (const [name, wc] of targets) {
      if (!wc) {
        windows[name] = false;
        continue;
      }
      await waitLoaded(wc);
      windows[name] = await hasBridge(wc);
      if (!windows[name]) failures.push(`window.pw missing in ${name}`);
    }

    // Offline cache round trip.
    const probe = { n: Date.now() };
    let cacheOk = false;
    try {
      ctx.services.cache.set("smoke", "probe", probe);
      const got = ctx.services.cache.get<{ n: number }>("smoke", "probe");
      ctx.services.cache.remove("smoke", "probe");
      cacheOk = got?.n === probe.n && ctx.services.cache.get("smoke", "probe") === null;
    } catch (err) {
      log.error(`smoke cache: ${errorMessage(err)}`);
    }
    if (!cacheOk) failures.push("cache round trip");

    // Auth store encrypt/decrypt with a dummy session, in its own file so the real session is untouched.
    const smokeFile = path.join(ctx.userData, "auth-session-smoke.enc.json");
    const dummy = {
      token: `smoke-${randomUUID()}`,
      user: { id: "smoke-user", email: "smoke@example.invalid", name: "Smoke" } as unknown as User,
    };
    let authOk = false;
    let encrypted = false;
    try {
      const store = new AuthStore(smokeFile);
      encrypted = store.set(dummy) === "safeStorage";
      authOk = new AuthStore(smokeFile).get()?.token === dummy.token;
      store.clear();
      authOk = authOk && new AuthStore(smokeFile).get() === null;
    } catch (err) {
      log.error(`smoke auth: ${errorMessage(err)}`);
    }
    if (!authOk) failures.push("auth store round trip");

    // Capture permission and STT status (informational, not failures).
    const screenPermission: PermissionStatus = await ctx.services.capture.permission("screen").catch(() => "unknown");
    const stt = await ctx.services.stt.status().catch(() => ({ available: false, permission: "unknown" as PermissionStatus, reason: "error" }));

    // Renderer server answers 200.
    let serverStatus: number | null = null;
    if (ctx.prodServerUrl) {
      try {
        const res = await fetch(`${ctx.prodServerUrl}/`, { signal: AbortSignal.timeout(5_000) });
        serverStatus = res.status;
      } catch {
        serverStatus = null;
      }
    }
    if (serverStatus !== 200) failures.push(`renderer server returned ${serverStatus ?? "no response"}`);
    if (ctx.prodServerError) failures.push(`renderer server: ${ctx.prodServerError}`);

    clearTimeout(watchdog);
    finish(failures.length === 0 ? 0 : 1, {
      channel: config.channel,
      windows,
      cache: { ok: cacheOk, backend: ctx.services.cache.backendName },
      auth: { ok: authOk, encrypted },
      capture: { screenPermission },
      stt: { available: stt.available, permission: stt.permission, reason: stt.reason },
      prodServer: { ok: serverStatus === 200, status: serverStatus },
    });
  } catch (err) {
    clearTimeout(watchdog);
    failures.push(errorMessage(err));
    finish(1, {});
  }
}
