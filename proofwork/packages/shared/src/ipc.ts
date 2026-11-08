// Desktop bridge contract: what the preload script exposes on `window.pw`, and the IPC channel names
// the main process handles. The renderer must also run in a plain browser (no Electron): it then uses
// a web fallback that implements the same interface with reduced capability.
import type { OverlayKind, ReleaseChannel, Surface } from "./constants.ts";
import type { OtaInfo, User } from "./domain.ts";

export type Unsubscribe = () => void;

export interface AppInfo {
  name: string;
  version: string;
  channel: ReleaseChannel;
  platform: "darwin" | "win32" | "linux" | "web";
  rendererUrl: string;
  serverUrl: string;
  electron: string | null;
  chrome: string | null;
  isPackaged: boolean;
}

export interface StoredSession {
  token: string;
  user: User;
}

/** Events from the on-device speech helper (STTStreamHelper). */
export type SttEvent =
  | { type: "partial"; turnId: string; text: string }
  | { type: "final"; turnId: string; text: string }
  | { type: "error"; turnId: string | null; code: string; message: string }
  | { type: "status"; status: "ready" | "started" | "stopped" | "unavailable" };

export interface ScreenshotResult {
  /** JPEG data URL, longest side ≤ maxWidth (default 1280). */
  dataUrl: string;
  width: number;
  height: number;
  /** False when the frame is visually identical (within threshold) to the previous capture. */
  changed: boolean;
  /** Fraction of sampled pixels that changed vs previous capture (0..1). */
  diff: number;
  focusedApp?: string;
  windowTitle?: string;
}

export type PermissionKind = "screen" | "microphone" | "camera" | "speech";
export type PermissionStatus = "granted" | "denied" | "not-determined" | "restricted" | "unknown";

export interface OverlayMessage {
  /** Surface that sent it. */
  from: Surface;
  channel: string;
  data: unknown;
}

export type ShortcutName = "bug-report" | "toggle-pip" | "push-to-talk";

export interface PwBridge {
  isElectron: boolean;
  platform: AppInfo["platform"];
  /** Which surface this window renders (from ?surface=, default "main"). */
  surface: Surface;

  app: {
    getInfo(): Promise<AppInfo>;
    openExternal(url: string): Promise<void>;
    setLaunchAtLogin(on: boolean): Promise<void>;
    getLaunchAtLogin(): Promise<boolean>;
    checkForUpdates(): Promise<OtaInfo>;
    relaunch(): Promise<void>;
    quit(): Promise<void>;
    /** Recent main-process log lines (redacted) for the bug reporter. */
    getLogs(): Promise<string>;
  };

  window: {
    minimize(): void;
    toggleMaximize(): void;
    close(): void;
    /** Push titlebar state (shown in shell.html): credits pill + level pill + title. */
    setTitlebar(state: { title?: string; credits?: number | null; level?: number; canGoBack?: boolean }): void;
    /** Shell titlebar buttons → main app (e.g. "back", "credits", "notifications", "support"). */
    onTitlebarAction(cb: (action: string) => void): Unsubscribe;
    /** Bring the main window to front (from an overlay). */
    focusMain(route?: string): void;
    /** Main window receives navigation requests from overlays / deep links. */
    onNavigate(cb: (route: string) => void): Unsubscribe;
  };

  auth: {
    /** Session decrypted from safeStorage (auth-session.enc.json). */
    getSession(): Promise<StoredSession | null>;
    setSession(session: StoredSession): Promise<void>;
    clearSession(): Promise<void>;
    /** Opens the system browser at the server's web login; resolves when the deep link returns. */
    startBrowserLogin(): Promise<StoredSession>;
    /** Fired in every window when the session changes (login, logout, refresh). */
    onSessionChanged(cb: (session: StoredSession | null) => void): Unsubscribe;
  };

  overlay: {
    open(kind: OverlayKind, payload?: unknown): Promise<void>;
    close(kind: OverlayKind): Promise<void>;
    isOpen(kind: OverlayKind): Promise<boolean>;
    /** Payload given to open() / setPayload(); overlays read it on mount. */
    getPayload(): Promise<unknown>;
    setPayload(kind: OverlayKind, payload: unknown): Promise<void>;
    /** Overlay windows default to click-through; call with false while the cursor is over interactive UI. */
    setIgnoreMouse(ignore: boolean): void;
    /** Resize the calling overlay window (content size, CSS px). */
    resizeSelf(width: number, height: number): void;
    /** Send a message to every other window (main + overlays). */
    broadcast(channel: string, data?: unknown): void;
    onMessage(cb: (msg: OverlayMessage) => void): Unsubscribe;
    onPayload(cb: (payload: unknown) => void): Unsubscribe;
  };

  /** Offline cache (SQLite in main): cache_entries(namespace,key,value,updated_at,synced_at,sync_pending). */
  cache: {
    get<T = unknown>(namespace: string, key: string): Promise<T | null>;
    set(namespace: string, key: string, value: unknown, opts?: { pendingSync?: boolean }): Promise<void>;
    remove(namespace: string, key: string): Promise<void>;
    list<T = unknown>(namespace: string): Promise<{ key: string; value: T; updatedAt: number }[]>;
    pending(): Promise<{ namespace: string; key: string; value: unknown }[]>;
    markSynced(namespace: string, key: string): Promise<void>;
  };

  /** On-device speech recognition through the native helper (macOS only). */
  stt: {
    status(): Promise<{ available: boolean; reason?: string; permission: PermissionStatus }>;
    start(turnId: string, vocabulary?: string[]): Promise<void>;
    /** 16 kHz mono Float32 PCM. */
    pushAudio(chunk: Float32Array): void;
    stop(): Promise<void>;
    onEvent(cb: (e: SttEvent) => void): Unsubscribe;
  };

  capture: {
    /** Captures the primary display (overlays excluded via content protection). */
    screenshot(opts?: { maxWidth?: number }): Promise<ScreenshotResult>;
    permission(kind: PermissionKind): Promise<PermissionStatus>;
    requestPermission(kind: PermissionKind): Promise<PermissionStatus>;
    openPermissionSettings(kind: PermissionKind): Promise<void>;
  };

  notifications: {
    /** Native OS notification (respects user settings in main). */
    show(n: { title: string; body: string; route?: string }): void;
    /** Pushed by the main-process notifications socket. */
    onPush(cb: (msg: { type: string; [k: string]: unknown }) => void): Unsubscribe;
  };

  shortcuts: {
    /** Global shortcuts: ⌘⇧B bug report, ⌘⇧P toggle PiP, ⌥Space push-to-talk (down/up). */
    onShortcut(cb: (name: ShortcutName, phase: "down" | "up" | "press") => void): Unsubscribe;
  };

  recording: {
    /** Streams a presentation recording to disk in chunks. Returns a local-video:// URL on finish. */
    begin(name: string): Promise<{ id: string }>;
    write(id: string, chunk: ArrayBuffer): Promise<void>;
    finish(id: string): Promise<{ url: string; path: string; bytes: number }>;
  };
}

/** IPC channel names (ipcMain.handle for invoke, ipcMain.on for send, webContents.send for events). */
export const IPC = {
  app: {
    getInfo: "pw:app:getInfo",
    openExternal: "pw:app:openExternal",
    setLaunchAtLogin: "pw:app:setLaunchAtLogin",
    getLaunchAtLogin: "pw:app:getLaunchAtLogin",
    checkForUpdates: "pw:app:checkForUpdates",
    relaunch: "pw:app:relaunch",
    quit: "pw:app:quit",
    getLogs: "pw:app:getLogs",
  },
  window: {
    minimize: "pw:window:minimize",
    toggleMaximize: "pw:window:toggleMaximize",
    close: "pw:window:close",
    setTitlebar: "pw:window:setTitlebar",
    /** main → shell.html */
    titlebarState: "pw:window:titlebarState",
    /** shell.html → main → app view */
    titlebarAction: "pw:window:titlebarAction",
    focusMain: "pw:window:focusMain",
    navigate: "pw:window:navigate",
  },
  auth: {
    getSession: "pw:auth:getSession",
    setSession: "pw:auth:setSession",
    clearSession: "pw:auth:clearSession",
    startBrowserLogin: "pw:auth:startBrowserLogin",
    sessionChanged: "pw:auth:sessionChanged",
  },
  overlay: {
    open: "pw:overlay:open",
    close: "pw:overlay:close",
    isOpen: "pw:overlay:isOpen",
    getPayload: "pw:overlay:getPayload",
    setPayload: "pw:overlay:setPayload",
    payload: "pw:overlay:payload",
    setIgnoreMouse: "pw:overlay:setIgnoreMouse",
    resizeSelf: "pw:overlay:resizeSelf",
    broadcast: "pw:overlay:broadcast",
    message: "pw:overlay:message",
  },
  cache: {
    get: "pw:cache:get",
    set: "pw:cache:set",
    remove: "pw:cache:remove",
    list: "pw:cache:list",
    pending: "pw:cache:pending",
    markSynced: "pw:cache:markSynced",
  },
  stt: {
    status: "pw:stt:status",
    start: "pw:stt:start",
    audio: "pw:stt:audio",
    stop: "pw:stt:stop",
    event: "pw:stt:event",
  },
  capture: {
    screenshot: "pw:capture:screenshot",
    permission: "pw:capture:permission",
    requestPermission: "pw:capture:requestPermission",
    openPermissionSettings: "pw:capture:openPermissionSettings",
  },
  notifications: {
    show: "pw:notifications:show",
    push: "pw:notifications:push",
  },
  shortcuts: {
    fired: "pw:shortcuts:fired",
  },
  recording: {
    begin: "pw:recording:begin",
    write: "pw:recording:write",
    finish: "pw:recording:finish",
  },
} as const;

/** Default overlay geometry (CSS px). x/y "center" | "right" | number; anchored to the primary display work area. */
export const OVERLAY_DEFAULTS: Record<
  OverlayKind,
  { width: number; height: number; anchor: "top-center" | "top-right" | "bottom-center" | "bottom-right" | "fullscreen" | "center"; clickThrough: boolean; focusable: boolean }
> = {
  pip: { width: 360, height: 520, anchor: "bottom-right", clickThrough: false, focusable: true },
  hud: { width: 420, height: 72, anchor: "top-center", clickThrough: true, focusable: false },
  island: { width: 460, height: 120, anchor: "top-center", clickThrough: true, focusable: true },
  cowork: { width: 0, height: 0, anchor: "fullscreen", clickThrough: true, focusable: false },
  recordbar: { width: 380, height: 64, anchor: "bottom-center", clickThrough: false, focusable: true },
  camera: { width: 240, height: 240, anchor: "bottom-right", clickThrough: false, focusable: false },
  region: { width: 0, height: 0, anchor: "fullscreen", clickThrough: false, focusable: true },
};

declare global {
  interface Window {
    pw?: PwBridge;
  }
}
