// Preload: exposes window.pw (PwBridge from @pw/shared) through contextBridge. Sandboxed, so it may only require("electron").
import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import {
  IPC,
  SURFACES,
  type AppInfo,
  type OverlayKind,
  type OverlayMessage,
  type PermissionKind,
  type PermissionStatus,
  type PwBridge,
  type ScreenshotResult,
  type ShortcutName,
  type Surface,
  type SttEvent,
  type StoredSession,
  type Unsubscribe,
} from "@pw/shared";
import type { OtaInfo } from "@pw/shared";

/** Titlebar state pushed to the shell (main → shell.html). */
export interface ShellTitlebarState {
  title?: string;
  credits?: number | null;
  level?: number;
  canGoBack?: boolean;
}

/** Extra members only present when the page is the shell (shell.html). The shell is the one page that sends titlebar actions. */
export interface ShellBridge {
  titlebarAction(action: string): void;
  onTitlebarState(cb: (state: ShellTitlebarState) => void): Unsubscribe;
}

export type PwGlobal = PwBridge & { shell?: ShellBridge };

function subscribe<T>(channel: string, cb: (payload: T) => void): Unsubscribe {
  const handler = (_event: IpcRendererEvent, payload: T) => cb(payload);
  ipcRenderer.on(channel, handler);
  return () => {
    ipcRenderer.removeListener(channel, handler);
  };
}

function resolveSurface(): Surface {
  // The shell page is the only file:// page; it renders the main window's titlebar.
  if (window.location.protocol === "file:") return "main";
  const raw = new URLSearchParams(window.location.search).get("surface");
  return raw !== null && (SURFACES as readonly string[]).includes(raw) ? (raw as Surface) : "main";
}

const surface = resolveSurface();

const bridge: PwBridge = {
  isElectron: true,
  platform: process.platform as AppInfo["platform"],
  surface,

  app: {
    getInfo: () => ipcRenderer.invoke(IPC.app.getInfo) as Promise<AppInfo>,
    openExternal: (url) => ipcRenderer.invoke(IPC.app.openExternal, url),
    setLaunchAtLogin: (on) => ipcRenderer.invoke(IPC.app.setLaunchAtLogin, on),
    getLaunchAtLogin: () => ipcRenderer.invoke(IPC.app.getLaunchAtLogin) as Promise<boolean>,
    checkForUpdates: () => ipcRenderer.invoke(IPC.app.checkForUpdates) as Promise<OtaInfo>,
    relaunch: () => ipcRenderer.invoke(IPC.app.relaunch),
    quit: () => ipcRenderer.invoke(IPC.app.quit),
    getLogs: () => ipcRenderer.invoke(IPC.app.getLogs) as Promise<string>,
  },

  window: {
    minimize: () => ipcRenderer.send(IPC.window.minimize),
    toggleMaximize: () => ipcRenderer.send(IPC.window.toggleMaximize),
    close: () => ipcRenderer.send(IPC.window.close),
    setTitlebar: (state) => ipcRenderer.send(IPC.window.setTitlebar, state),
    onTitlebarAction: (cb) => subscribe<string>(IPC.window.titlebarAction, cb),
    focusMain: (route) => ipcRenderer.send(IPC.window.focusMain, route),
    onNavigate: (cb) => subscribe<string>(IPC.window.navigate, cb),
  },

  auth: {
    getSession: () => ipcRenderer.invoke(IPC.auth.getSession) as Promise<StoredSession | null>,
    setSession: (session) => ipcRenderer.invoke(IPC.auth.setSession, session),
    clearSession: () => ipcRenderer.invoke(IPC.auth.clearSession),
    startBrowserLogin: () => ipcRenderer.invoke(IPC.auth.startBrowserLogin) as Promise<StoredSession>,
    onSessionChanged: (cb) => subscribe<StoredSession | null>(IPC.auth.sessionChanged, cb),
  },

  overlay: {
    open: (kind: OverlayKind, payload?: unknown) => ipcRenderer.invoke(IPC.overlay.open, kind, payload),
    close: (kind: OverlayKind) => ipcRenderer.invoke(IPC.overlay.close, kind),
    isOpen: (kind: OverlayKind) => ipcRenderer.invoke(IPC.overlay.isOpen, kind) as Promise<boolean>,
    getPayload: () => ipcRenderer.invoke(IPC.overlay.getPayload) as Promise<unknown>,
    setPayload: (kind: OverlayKind, payload: unknown) => ipcRenderer.invoke(IPC.overlay.setPayload, kind, payload),
    setIgnoreMouse: (ignore: boolean) => ipcRenderer.send(IPC.overlay.setIgnoreMouse, ignore),
    resizeSelf: (width: number, height: number) => ipcRenderer.send(IPC.overlay.resizeSelf, width, height),
    broadcast: (channel: string, data?: unknown) => ipcRenderer.send(IPC.overlay.broadcast, channel, data),
    onMessage: (cb: (msg: OverlayMessage) => void) => subscribe<OverlayMessage>(IPC.overlay.message, cb),
    onPayload: (cb: (payload: unknown) => void) => subscribe<unknown>(IPC.overlay.payload, cb),
  },

  cache: {
    get: <T = unknown>(namespace: string, key: string) => ipcRenderer.invoke(IPC.cache.get, namespace, key) as Promise<T | null>,
    set: (namespace, key, value, opts) => ipcRenderer.invoke(IPC.cache.set, namespace, key, value, opts),
    remove: (namespace, key) => ipcRenderer.invoke(IPC.cache.remove, namespace, key),
    list: <T = unknown>(namespace: string) =>
      ipcRenderer.invoke(IPC.cache.list, namespace) as Promise<{ key: string; value: T; updatedAt: number }[]>,
    pending: () => ipcRenderer.invoke(IPC.cache.pending) as Promise<{ namespace: string; key: string; value: unknown }[]>,
    markSynced: (namespace, key) => ipcRenderer.invoke(IPC.cache.markSynced, namespace, key),
  },

  stt: {
    status: () =>
      ipcRenderer.invoke(IPC.stt.status) as Promise<{ available: boolean; reason?: string; permission: PermissionStatus }>,
    start: (turnId: string, vocabulary?: string[]) => ipcRenderer.invoke(IPC.stt.start, turnId, vocabulary),
    pushAudio: (chunk: Float32Array) => ipcRenderer.send(IPC.stt.audio, chunk),
    stop: () => ipcRenderer.invoke(IPC.stt.stop),
    onEvent: (cb: (e: SttEvent) => void) => subscribe<SttEvent>(IPC.stt.event, cb),
  },

  capture: {
    screenshot: (opts?: { maxWidth?: number }) => ipcRenderer.invoke(IPC.capture.screenshot, opts) as Promise<ScreenshotResult>,
    permission: (kind: PermissionKind) => ipcRenderer.invoke(IPC.capture.permission, kind) as Promise<PermissionStatus>,
    requestPermission: (kind: PermissionKind) =>
      ipcRenderer.invoke(IPC.capture.requestPermission, kind) as Promise<PermissionStatus>,
    openPermissionSettings: (kind: PermissionKind) => ipcRenderer.invoke(IPC.capture.openPermissionSettings, kind),
  },

  notifications: {
    show: (n) => ipcRenderer.send(IPC.notifications.show, n),
    onPush: (cb) => subscribe<{ type: string; [k: string]: unknown }>(IPC.notifications.push, cb),
  },

  shortcuts: {
    onShortcut: (cb: (name: ShortcutName, phase: "down" | "up" | "press") => void) =>
      subscribe<{ name: ShortcutName; phase: "down" | "up" | "press" }>(IPC.shortcuts.fired, (p) => cb(p.name, p.phase)),
  },

  recording: {
    begin: (name: string) => ipcRenderer.invoke(IPC.recording.begin, name) as Promise<{ id: string }>,
    write: (id: string, chunk: ArrayBuffer) => ipcRenderer.invoke(IPC.recording.write, id, chunk),
    finish: (id: string) =>
      ipcRenderer.invoke(IPC.recording.finish, id) as Promise<{ url: string; path: string; bytes: number }>,
  },
};

const shellBridge: ShellBridge = {
  titlebarAction: (action: string) => ipcRenderer.send(IPC.window.titlebarAction, action),
  onTitlebarState: (cb) => subscribe<ShellTitlebarState>(IPC.window.titlebarState, cb),
};

const isShell = window.location.protocol === "file:";
const exposed: PwGlobal = isShell ? { ...bridge, shell: shellBridge } : bridge;
contextBridge.exposeInMainWorld("pw", exposed);
