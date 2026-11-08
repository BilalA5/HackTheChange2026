import {
  OVERLAY_DEFAULTS,
  SURFACES,
  type OverlayKind,
  type OverlayMessage,
  type PermissionKind,
  type PermissionStatus,
  type PwBridge,
  type ShortcutName,
  type StoredSession,
  type Surface,
  type Unsubscribe,
} from "@pw/shared";
import { useOverlayHost } from "@/stores/overlayHost";
import { useTitlebar } from "@/stores/titlebar";
import { newUuid } from "./uuid";
import { WEB_SERVER_URL } from "./env";

/*
 * Web fallback for window.pw. It lets the whole renderer run in a normal browser for QA.
 *
 * What is real:  session (localStorage), notifications (Notification API), screen-less recording (in memory),
 *                titlebar state (zustand), cache (localStorage), ⌘/Ctrl+Shift+B shortcut, cross-window messages.
 * What is faked: overlays. Each overlay is an <iframe src="/?surface=kind"> mounted by <OverlayHost/> at the
 *                OVERLAY_DEFAULTS anchor. Limitations:
 *                - Iframes cannot be click-through or always-on-top of other apps; they sit inside this page.
 *                - setIgnoreMouse/resizeSelf are no-ops.
 *                - Payloads are delivered two ways: sessionStorage["pw.overlay.payload:<kind>"] (read by
 *                  getPayload on mount, same origin shares sessionStorage per tab) and a postMessage from the host
 *                  iframe on load and on every setPayload.
 *                - Messages between windows use BroadcastChannel("pw-overlays"). The sender never receives its own.
 * What is absent: screen capture, STT, LiveKit, OS permissions. They reject or report "unknown"/"web".
 */

export const OVERLAY_CHANNEL = "pw-overlays";
const SESSION_KEY = "pw.session";
const PAYLOAD_MSG = "pwOverlayPayload";
const INTERNAL_NAVIGATE = "__pw.navigate";
const INTERNAL_PAYLOAD = "__pw.payload";
const LAUNCH_KEY = "pw.launchAtLogin";
const PAYLOAD_WAIT_MS = 1500;

export function readSurface(search: string): Surface {
  const v = new URLSearchParams(search).get("surface");
  return v !== null && (SURFACES as readonly string[]).includes(v) ? (v as Surface) : "main";
}

function isStoredSession(v: unknown): v is StoredSession {
  return typeof v === "object" && v !== null && typeof (v as { token?: unknown }).token === "string" && "user" in v;
}

function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function payloadKey(kind: string): string {
  return `pw.overlay.payload:${kind}`;
}

function writeStoredPayload(kind: string, payload: unknown): void {
  try {
    sessionStorage.setItem(payloadKey(kind), JSON.stringify(payload ?? null));
  } catch {
    /* storage full or blocked: the postMessage path still works */
  }
}

function readStoredPayload(kind: string): { found: true; value: unknown } | { found: false } {
  try {
    const raw = sessionStorage.getItem(payloadKey(kind));
    if (raw === null) return { found: false };
    return { found: true, value: JSON.parse(raw) as unknown };
  } catch {
    return { found: false };
  }
}

interface Envelope {
  from: Surface;
  channel: string;
  data: unknown;
}

function parseEnvelope(v: unknown): Envelope | null {
  if (typeof v !== "object" || v === null) return null;
  const e = v as Partial<Envelope>;
  return typeof e.from === "string" && typeof e.channel === "string" ? (e as Envelope) : null;
}

interface CacheRecord {
  value: unknown;
  updatedAt: number;
  pending: boolean;
}

function readCacheNs(ns: string): Record<string, CacheRecord> {
  try {
    const raw = localStorage.getItem(`pw.cache:${ns}`);
    return raw ? (JSON.parse(raw) as Record<string, CacheRecord>) : {};
  } catch {
    return {};
  }
}

function writeCacheNs(ns: string, data: Record<string, CacheRecord>): void {
  try {
    localStorage.setItem(`pw.cache:${ns}`, JSON.stringify(data));
  } catch {
    /* quota: drop silently, the cache is best effort */
  }
}

export function createWebBridge(): PwBridge {
  const surface = readSurface(typeof location !== "undefined" ? location.search : "");
  const sessionListeners = new Set<(s: StoredSession | null) => void>();
  const messageListeners = new Set<(m: OverlayMessage) => void>();
  const navListeners = new Set<(route: string) => void>();
  const payloadListeners = new Set<(p: unknown) => void>();
  const recordings = new Map<string, { name: string; parts: ArrayBuffer[]; bytes: number }>();
  const channel = typeof BroadcastChannel === "function" ? new BroadcastChannel(OVERLAY_CHANNEL) : null;

  const notifySession = (s: StoredSession | null) => sessionListeners.forEach((cb) => cb(s));
  const navigate = (route: string) => navListeners.forEach((cb) => cb(route));

  channel?.addEventListener("message", (ev: MessageEvent<unknown>) => {
    const env = parseEnvelope(ev.data);
    if (!env) return;
    if (env.channel === INTERNAL_NAVIGATE) {
      if (typeof env.data === "string") navigate(env.data);
      return;
    }
    if (env.channel === INTERNAL_PAYLOAD) {
      const d = env.data as { kind?: unknown; payload?: unknown };
      if (d.kind === surface) payloadListeners.forEach((cb) => cb(d.payload));
      return;
    }
    const msg: OverlayMessage = { from: env.from, channel: env.channel, data: env.data };
    messageListeners.forEach((cb) => cb(msg));
  });

  // Session changes made by another tab.
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (ev) => {
      if (ev.key === SESSION_KEY) notifySession(readSession());
    });
    // Payloads pushed by the host page into an overlay iframe.
    window.addEventListener("message", (ev: MessageEvent<unknown>) => {
      if (ev.origin !== location.origin || typeof ev.data !== "object" || ev.data === null) return;
      const d = ev.data as { [PAYLOAD_MSG]?: unknown; kind?: unknown; payload?: unknown };
      if (d[PAYLOAD_MSG] === true && d.kind === surface) payloadListeners.forEach((cb) => cb(d.payload));
    });
  }

  const bridge: PwBridge = {
    isElectron: false,
    platform: "web",
    surface,

    app: {
      async getInfo() {
        return {
          name: "Proofwork",
          version: "0.1.0-web",
          channel: "dev",
          platform: "web",
          rendererUrl: typeof location !== "undefined" ? location.origin : "",
          serverUrl: WEB_SERVER_URL,
          electron: null,
          chrome: null,
          isPackaged: false,
        };
      },
      async openExternal(url) {
        window.open(url, "_blank", "noopener,noreferrer");
      },
      async setLaunchAtLogin(on) {
        try {
          localStorage.setItem(LAUNCH_KEY, on ? "1" : "0");
        } catch {
          /* ignore */
        }
      },
      async getLaunchAtLogin() {
        try {
          return localStorage.getItem(LAUNCH_KEY) === "1";
        } catch {
          return false;
        }
      },
      async checkForUpdates() {
        return { channel: "dev", version: "0.1.0-web", notes: "", url: null, publishedAt: new Date().toISOString() };
      },
      async relaunch() {
        location.reload();
      },
      async quit() {
        window.close();
      },
      async getLogs() {
        return "web build: no main-process logs";
      },
    },

    window: {
      minimize() {},
      toggleMaximize() {},
      close() {},
      setTitlebar(state) {
        useTitlebar.getState().patch(state);
      },
      onTitlebarAction: () => () => {},
      focusMain(route) {
        if (surface !== "main") {
          channel?.postMessage({ from: surface, channel: INTERNAL_NAVIGATE, data: route ?? "" });
          window.focus();
          return;
        }
        window.focus();
        if (route) navigate(route);
      },
      onNavigate(cb) {
        navListeners.add(cb);
        return () => navListeners.delete(cb);
      },
    },

    auth: {
      async getSession() {
        return readSession();
      },
      async setSession(session) {
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        } catch {
          /* ignore */
        }
        notifySession(session);
      },
      async clearSession() {
        try {
          localStorage.removeItem(SESSION_KEY);
        } catch {
          /* ignore */
        }
        notifySession(null);
      },
      async startBrowserLogin(): Promise<StoredSession> {
        throw new Error("Browser login is only available in the Proofwork desktop app.");
      },
      onSessionChanged(cb): Unsubscribe {
        sessionListeners.add(cb);
        return () => sessionListeners.delete(cb);
      },
    },

    overlay: {
      async open(kind: OverlayKind, payload?: unknown) {
        writeStoredPayload(kind, payload);
        useOverlayHost.getState().open(kind, payload);
      },
      async close(kind: OverlayKind) {
        useOverlayHost.getState().close(kind);
      },
      async isOpen(kind: OverlayKind) {
        return useOverlayHost.getState().isOpen(kind);
      },
      async getPayload(): Promise<unknown> {
        if (surface === "main") return null;
        const stored = readStoredPayload(surface);
        if (stored.found) return stored.value;
        // Not in sessionStorage yet: wait briefly for the host's postMessage.
        return new Promise<unknown>((resolve) => {
          const off = bridge.overlay.onPayload((p) => {
            clearTimeout(timer);
            off();
            resolve(p);
          });
          const timer = setTimeout(() => {
            off();
            resolve(null);
          }, PAYLOAD_WAIT_MS);
        });
      },
      async setPayload(kind: OverlayKind, payload: unknown) {
        writeStoredPayload(kind, payload);
        useOverlayHost.getState().setPayload(kind, payload);
      },
      setIgnoreMouse() {},
      resizeSelf() {},
      broadcast(ch: string, data?: unknown) {
        channel?.postMessage({ from: surface, channel: ch, data: data ?? null });
      },
      onMessage(cb) {
        messageListeners.add(cb);
        return () => messageListeners.delete(cb);
      },
      onPayload(cb) {
        payloadListeners.add(cb);
        return () => payloadListeners.delete(cb);
      },
    },

    cache: {
      async get<T = unknown>(ns: string, key: string): Promise<T | null> {
        const rec = readCacheNs(ns)[key];
        return rec ? (rec.value as T) : null;
      },
      async set(ns, key, value, opts) {
        const data = readCacheNs(ns);
        data[key] = { value, updatedAt: Date.now(), pending: opts?.pendingSync === true };
        writeCacheNs(ns, data);
      },
      async remove(ns, key) {
        const data = readCacheNs(ns);
        delete data[key];
        writeCacheNs(ns, data);
      },
      async list<T = unknown>(ns: string) {
        return Object.entries(readCacheNs(ns)).map(([key, rec]) => ({
          key,
          value: rec.value as T,
          updatedAt: rec.updatedAt,
        }));
      },
      async pending() {
        const out: { namespace: string; key: string; value: unknown }[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k?.startsWith("pw.cache:")) continue;
          const ns = k.slice("pw.cache:".length);
          for (const [key, rec] of Object.entries(readCacheNs(ns))) {
            if (rec.pending) out.push({ namespace: ns, key, value: rec.value });
          }
        }
        return out;
      },
      async markSynced(ns, key) {
        const data = readCacheNs(ns);
        if (data[key]) data[key] = { ...data[key], pending: false };
        writeCacheNs(ns, data);
      },
    },

    stt: {
      async status() {
        return { available: false, reason: "web", permission: "unknown" as PermissionStatus };
      },
      async start() {},
      pushAudio() {},
      async stop() {},
      onEvent: () => () => {},
    },

    capture: {
      async screenshot() {
        throw new Error("Screen capture needs the Proofwork desktop app.");
      },
      async permission(_kind: PermissionKind) {
        return "unknown" as PermissionStatus;
      },
      async requestPermission(_kind: PermissionKind) {
        return "unknown" as PermissionStatus;
      },
      async openPermissionSettings() {},
    },

    notifications: {
      show(n) {
        if (typeof Notification === "undefined") return;
        const fire = () => {
          const note = new Notification(n.title, { body: n.body });
          note.onclick = () => {
            window.focus();
            if (n.route) navigate(n.route);
          };
        };
        if (Notification.permission === "granted") fire();
        else if (Notification.permission === "default") {
          void Notification.requestPermission().then((p) => {
            if (p === "granted") fire();
          });
        }
      },
      onPush: () => () => {},
    },

    shortcuts: {
      onShortcut(cb: (name: ShortcutName, phase: "down" | "up" | "press") => void): Unsubscribe {
        const handler = (e: KeyboardEvent) => {
          if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "b") {
            e.preventDefault();
            cb("bug-report", "press");
          }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
      },
    },

    recording: {
      async begin(name) {
        const id = newUuid();
        recordings.set(id, { name, parts: [], bytes: 0 });
        return { id };
      },
      async write(id, chunk) {
        const rec = recordings.get(id);
        if (!rec) throw new Error(`Unknown recording ${id}`);
        rec.parts.push(chunk);
        rec.bytes += chunk.byteLength;
      },
      async finish(id) {
        const rec = recordings.get(id);
        if (!rec) throw new Error(`Unknown recording ${id}`);
        recordings.delete(id);
        const blob = new Blob(rec.parts, { type: "video/webm" });
        return { url: URL.createObjectURL(blob), path: rec.name, bytes: rec.bytes };
      },
    },
  };

  return bridge;
}
