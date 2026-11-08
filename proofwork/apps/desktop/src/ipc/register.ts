// IPC registry. Every channel in IPC (packages/shared/src/ipc.ts) is handled here.
// Each handler checks the sender is one of our pages and validates arguments before use.
import { app, ipcMain, shell, type IpcMainEvent, type IpcMainInvokeEvent } from "electron";
import { IPC, type OverlayKind, type PermissionKind, type StoredSession } from "@pw/shared";
import { rendererOrigin } from "../config.ts";
import { errorMessage, logText, log } from "../log.ts";
import { appInfo, getLaunchAtLogin, setLaunchAtLogin } from "../services/system.ts";
import { checkForUpdates } from "../services/updater.ts";
import { AuthStore, isStoredSession } from "../services/authStore.ts";
import { startBrowserLogin, type AuthDeps } from "../services/authFlow.ts";
import type { OfflineCache } from "../services/cache.ts";
import type { SttBridge } from "../services/stt.ts";
import type { CaptureService } from "../services/capture.ts";
import { beginRecording, finishRecording, writeRecording } from "../services/recording.ts";
import { showNative } from "../services/nativeNotify.ts";
import { mainWindow, focusMain, forwardTitlebarAction, setTitlebar, TITLEBAR_ACTIONS, shellUrl } from "../windows/mainWindow.ts";
import { OVERLAY_KINDS, openOverlay, closeOverlay, isOverlayOpen, getPayloadFor, setPayload, setIgnoreMouseFor, resizeOverlayFor, broadcastFrom } from "../windows/overlays.ts";
import { state } from "../windows/registry.ts";
import { bool, externalUrl, num, obj, oneOf, optStr, route, str, strArray } from "./validate.ts";
import { TURN_ID } from "../services/stt.ts";

export interface Services {
  cache: OfflineCache;
  auth: AuthStore;
  authDeps: () => AuthDeps;
  stt: SttBridge;
  capture: CaptureService;
}

const PERMISSIONS: readonly PermissionKind[] = ["screen", "microphone", "camera", "speech"];
const MAX_CACHE_JSON = 2_000_000;

/** True only for our own renderer origin or the shell page. Remote or injected frames are refused. */
export function isTrustedSender(event: { senderFrame?: { url: string } | null }): boolean {
  const url = event.senderFrame?.url ?? "";
  if (url.startsWith("file:")) return url === shellUrl();
  try {
    return new URL(url).origin === rendererOrigin;
  } catch {
    return false;
  }
}

function handle(channel: string, fn: (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown): void {
  ipcMain.handle(channel, (event, ...args: unknown[]) => {
    if (!isTrustedSender(event)) throw new Error("untrusted sender");
    return fn(event, ...args);
  });
}

function on(channel: string, fn: (event: IpcMainEvent, ...args: unknown[]) => void): void {
  ipcMain.on(channel, (event, ...args: unknown[]) => {
    if (!isTrustedSender(event)) return;
    try {
      fn(event, ...args);
    } catch (err) {
      log.warn(`${channel} rejected: ${errorMessage(err)}`);
    }
  });
}

export function registerIpc(svc: Services): void {
  const token = () => svc.auth.get()?.token ?? null;

  // app
  handle(IPC.app.getInfo, () => appInfo());
  handle(IPC.app.openExternal, (_e, url) => shell.openExternal(externalUrl(url)));
  handle(IPC.app.setLaunchAtLogin, (_e, on) => setLaunchAtLogin(bool(on, "on")));
  handle(IPC.app.getLaunchAtLogin, () => getLaunchAtLogin());
  handle(IPC.app.checkForUpdates, () => checkForUpdates(token()));
  handle(IPC.app.relaunch, () => {
    app.relaunch();
    app.exit(0);
  });
  handle(IPC.app.quit, () => app.quit());
  handle(IPC.app.getLogs, () => logText());

  // window
  on(IPC.window.minimize, () => mainWindow()?.minimize());
  on(IPC.window.toggleMaximize, () => {
    const win = mainWindow();
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  on(IPC.window.close, () => mainWindow()?.close());
  on(IPC.window.setTitlebar, (_e, value) => {
    const v = obj(value, "titlebar state");
    const next: Parameters<typeof setTitlebar>[0] = {};
    if (v.title !== undefined) next.title = str(v.title, "title", 200);
    if (v.credits !== undefined) {
      if (v.credits !== null) num(v.credits, "credits", 0, 1e12);
      next.credits = v.credits as number | null;
    }
    if (v.level !== undefined) next.level = num(v.level, "level", 0, 100);
    if (v.canGoBack !== undefined) next.canGoBack = bool(v.canGoBack, "canGoBack");
    setTitlebar(next);
  });
  on(IPC.window.titlebarAction, (e, action) => {
    // Only the shell may send titlebar actions; they are forwarded to the app view.
    if (!state.main || e.sender !== state.main.webContents) return;
    const name = oneOf(action, TITLEBAR_ACTIONS, "titlebar action");
    forwardTitlebarAction(name);
  });
  on(IPC.window.focusMain, (_e, r) => focusMain(r === undefined ? undefined : route(r)));

  // auth
  handle(IPC.auth.getSession, () => svc.auth.get());
  handle(IPC.auth.setSession, (_e, session) => {
    if (!isStoredSession(session)) throw new Error("invalid session");
    svc.auth.set(session as StoredSession);
  });
  handle(IPC.auth.clearSession, () => svc.auth.clear());
  handle(IPC.auth.startBrowserLogin, () => startBrowserLogin(svc.authDeps()));

  // overlay
  const kind = (v: unknown) => oneOf<OverlayKind>(v, OVERLAY_KINDS, "overlay kind");
  handle(IPC.overlay.open, (_e, k, payload) => openOverlay(kind(k), payload));
  handle(IPC.overlay.close, (_e, k) => closeOverlay(kind(k)));
  handle(IPC.overlay.isOpen, (_e, k) => isOverlayOpen(kind(k)));
  handle(IPC.overlay.getPayload, (e) => getPayloadFor(e.sender));
  handle(IPC.overlay.setPayload, (_e, k, payload) => setPayload(kind(k), payload));
  on(IPC.overlay.setIgnoreMouse, (e, ignore) => setIgnoreMouseFor(e.sender, bool(ignore, "ignore")));
  on(IPC.overlay.resizeSelf, (e, w, h) => resizeOverlayFor(e.sender, num(w, "width", 1, 4096), num(h, "height", 1, 4096)));
  on(IPC.overlay.broadcast, (e, channel, data) => {
    broadcastFrom(e.sender, str(channel, "channel", 200), data);
  });

  // cache
  const cacheKey = (v: unknown, name: string) => str(v, name, 200);
  handle(IPC.cache.get, (_e, ns, key) => svc.cache.get(cacheKey(ns, "namespace"), cacheKey(key, "key")));
  handle(IPC.cache.set, (_e, ns, key, value, opts) => {
    const json = JSON.stringify(value);
    if (json !== undefined && json.length > MAX_CACHE_JSON) throw new Error("cache value too large");
    const o = opts === undefined || opts === null ? {} : obj(opts, "opts");
    svc.cache.set(cacheKey(ns, "namespace"), cacheKey(key, "key"), value, { pendingSync: o.pendingSync === true });
  });
  handle(IPC.cache.remove, (_e, ns, key) => svc.cache.remove(cacheKey(ns, "namespace"), cacheKey(key, "key")));
  handle(IPC.cache.list, (_e, ns) => svc.cache.list(cacheKey(ns, "namespace")));
  handle(IPC.cache.pending, () => svc.cache.pending());
  handle(IPC.cache.markSynced, (_e, ns, key) => svc.cache.markSynced(cacheKey(ns, "namespace"), cacheKey(key, "key")));

  // stt
  handle(IPC.stt.status, () => svc.stt.status());
  handle(IPC.stt.start, (e, turnId, vocabulary) => {
    const id = str(turnId, "turn id", 64);
    if (!TURN_ID.test(id)) throw new Error("invalid turn id");
    const vocab = vocabulary === undefined || vocabulary === null ? [] : strArray(vocabulary, "vocabulary");
    svc.stt.start(e.sender.id, id, vocab);
  });
  on(IPC.stt.audio, (_e, chunk) => {
    if (!(chunk instanceof Float32Array)) throw new Error("invalid audio chunk");
    svc.stt.pushAudio(chunk);
  });
  handle(IPC.stt.stop, () => svc.stt.stop());

  // capture
  handle(IPC.capture.screenshot, (_e, opts) => {
    const o = opts === undefined || opts === null ? {} : obj(opts, "opts");
    const maxWidth = o.maxWidth === undefined ? 1280 : num(o.maxWidth, "maxWidth", 64, 3840);
    return svc.capture.screenshot(maxWidth);
  });
  handle(IPC.capture.permission, (_e, k) => svc.capture.permission(oneOf(k, PERMISSIONS, "permission kind")));
  handle(IPC.capture.requestPermission, (_e, k) => svc.capture.requestPermission(oneOf(k, PERMISSIONS, "permission kind")));
  handle(IPC.capture.openPermissionSettings, (_e, k) =>
    svc.capture.openPermissionSettings(oneOf(k, PERMISSIONS, "permission kind")),
  );

  // notifications
  on(IPC.notifications.show, (_e, n) => {
    const v = obj(n, "notification");
    showNative({
      title: str(v.title, "title", 200),
      body: str(v.body, "body", 1000),
      route: optStr(v.route, "route", 300) ? route(v.route) : undefined,
    });
  });

  // recording
  handle(IPC.recording.begin, (_e, name) => beginRecording(str(name, "name", 120)));
  handle(IPC.recording.write, (_e, id, chunk) => {
    if (!(chunk instanceof ArrayBuffer)) throw new Error("invalid chunk");
    return writeRecording(str(id, "id", 64), chunk);
  });
  handle(IPC.recording.finish, (_e, id) => finishRecording(str(id, "id", 64)));

}
