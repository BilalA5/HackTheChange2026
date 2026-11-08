import { RELIABLE_SOCKET } from "@pw/shared";
import { emitSocketMessage, emitSocketStatus } from "./bus";
import { newUuid } from "../uuid";

/*
 * Reliable socket, implementing packages/shared/src/ws.ts:
 *  1. The first frame after open is {action:"auth", token, session_id, device_id}.
 *  2. Every sent frame carries a client event_key (uuid). Frames go into a localStorage outbox
 *     "<path>_events_queue" until the server answers {type:"ack", event_key}.
 *  3. On connection_registered the outbox is replayed. An item is sent at most MAX_TRY (3) times in total.
 *  4. {action:"ping"} every 15 s. No inbound frame for 40 s means a forced reconnect.
 *  5. Reconnect back-off: 500 ms doubling to 30 s. After 8 consecutive failures: "reconnect-exhausted".
 */

const OPEN = 1;

export type SocketStatus = "connecting" | "open" | "closed" | "reconnect-exhausted";

export interface AuthPayload {
  token: string;
  session_id: string;
  device_id: string;
}

export interface OutboxItem {
  payload: Record<string, unknown> & { event_key: string };
  /** How many times this frame has been put on the wire. */
  try: number;
  status: "pending" | "failed_terminal";
  createdAt: number;
}
export type OutboxMap = Record<string, OutboxItem>;

export interface ReliableSocketOptions {
  /** Short socket name used on the event bus, e.g. "cowork" or "notifications". */
  name: string;
  /** WebSocket path, e.g. "/ws/cowork". Also names the outbox key. */
  path: string;
  /** HTTP origin of the server (http:// or https://). Read on every connect, so it can change. */
  baseUrl: () => string;
  /** Supplies token, session id and device id for the auth frame. */
  auth: () => Promise<AuthPayload> | AuthPayload;
  /** Defaults to localStorage. Pass null to keep the outbox in memory only (lost on reload). */
  storage?: Storage | null;
  /** Defaults to the global WebSocket. Injected by tests. */
  WebSocketImpl?: typeof WebSocket;
  /** Also emit frames on the window bus (se:<name>:...). Default true. */
  emitBus?: boolean;
  maxFailures?: number;
  maxTry?: number;
  pingIntervalMs?: number;
  staleAfterMs?: number;
  backoffBaseMs?: number;
  backoffMaxMs?: number;
}

type AnyListener = (msg: unknown) => void;

/** Distributes Omit over a union so each variant keeps its own fields. */
export type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * In: server frames (discriminated by `type`). Out: client frames (discriminated by `action`), without event_key.
 */
export class ReliableSocket<In extends { type: string }, Out extends { action: string } = { action: string }> {
  private ws: WebSocket | null = null;
  private registered = false;
  private halted = false;
  private closedByUser = false;
  private failures = 0;
  private status: SocketStatus = "closed";
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private staleTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private memOutbox: OutboxMap = {};
  private readonly listeners = new Map<string, Set<AnyListener>>();
  private readonly statusListeners = new Set<(s: SocketStatus) => void>();

  private readonly storage: Storage | null;
  private readonly outboxKey: string;
  private readonly WS: typeof WebSocket;
  private readonly maxFailures: number;
  private readonly maxTry: number;
  private readonly pingIntervalMs: number;
  private readonly staleAfterMs: number;
  private readonly backoffBaseMs: number;
  private readonly backoffMaxMs: number;

  constructor(private readonly opts: ReliableSocketOptions) {
    this.storage =
      opts.storage !== undefined ? opts.storage : typeof localStorage !== "undefined" ? localStorage : null;
    this.outboxKey = `${opts.path}_events_queue`;
    this.WS = opts.WebSocketImpl ?? (globalThis.WebSocket as typeof WebSocket);
    this.maxFailures = opts.maxFailures ?? 8;
    this.maxTry = opts.maxTry ?? RELIABLE_SOCKET.MAX_TRY;
    this.pingIntervalMs = opts.pingIntervalMs ?? RELIABLE_SOCKET.PING_INTERVAL_MS;
    this.staleAfterMs = opts.staleAfterMs ?? RELIABLE_SOCKET.STALE_AFTER_MS;
    this.backoffBaseMs = opts.backoffBaseMs ?? RELIABLE_SOCKET.BACKOFF_BASE_MS;
    this.backoffMaxMs = opts.backoffMaxMs ?? RELIABLE_SOCKET.BACKOFF_MAX_MS;
  }

  getStatus(): SocketStatus {
    return this.status;
  }

  /** Opens the socket. Calling it again after "reconnect-exhausted" starts a fresh set of retries. */
  connect(): void {
    if (this.ws || this.reconnectTimer) return;
    this.halted = false;
    this.closedByUser = false;
    this.failures = 0;
    this.openSocket();
  }

  /** Closes for good: no reconnect until connect() is called again. */
  close(): void {
    this.closedByUser = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    const ws = this.teardown();
    try {
      ws?.close();
    } catch {
      /* already closed */
    }
    this.setStatus("closed");
  }

  /**
   * Sends a frame with a fresh event_key. Returns the key. While offline the frame waits in the outbox and
   * goes out after the next registration.
   */
  send(frame: Out): string {
    const event_key = newUuid();
    const payload = { ...frame, event_key } as Record<string, unknown> & { event_key: string };
    const live = this.isLive();
    const q = this.readOutbox();
    q[event_key] = { payload, try: live ? 1 : 0, status: "pending", createdAt: Date.now() };
    this.writeOutbox(q);
    if (live) this.raw(payload);
    return event_key;
  }

  /** Subscribes to frames of one server type. Returns an unsubscribe function. */
  on<K extends In["type"]>(type: K, cb: (msg: Extract<In, { type: K }>) => void): () => void {
    const set = this.listeners.get(type) ?? new Set<AnyListener>();
    this.listeners.set(type, set);
    const listener = cb as AnyListener;
    set.add(listener);
    return () => set.delete(listener);
  }

  onStatus(cb: (s: SocketStatus) => void): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  /** Test and debugging helper: the outbox as stored. */
  outboxSnapshot(): OutboxMap {
    return this.readOutbox();
  }

  // ───────────────────────── internals ─────────────────────────

  private isLive(): boolean {
    return this.ws !== null && this.registered && this.ws.readyState === OPEN;
  }

  private openSocket(): void {
    this.setStatus("connecting");
    const url = `${this.opts.baseUrl().replace(/^http/, "ws").replace(/\/$/, "")}${this.opts.path}`;
    let ws: WebSocket;
    try {
      ws = new this.WS(url);
    } catch {
      this.onDisconnected();
      return;
    }
    this.ws = ws;
    ws.onopen = () => {
      void this.authenticate(ws);
    };
    ws.onmessage = (ev: MessageEvent) => this.onFrame(ev.data);
    ws.onclose = () => this.handleClose(ws);
    ws.onerror = () => {
      /* a close event always follows */
    };
  }

  private async authenticate(ws: WebSocket): Promise<void> {
    let auth: AuthPayload;
    try {
      auth = await this.opts.auth();
    } catch {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      return;
    }
    if (this.ws !== ws || ws.readyState !== OPEN) return;
    // Auth goes first. The server answers connection_registered, and only then do we replay.
    this.raw({ action: "auth", token: auth.token, session_id: auth.session_id, device_id: auth.device_id });
    this.startTimers();
  }

  private onFrame(data: unknown): void {
    this.bumpStale();
    let msg: unknown;
    try {
      msg = JSON.parse(String(data)) as unknown;
    } catch {
      return;
    }
    if (!isRecord(msg) || typeof msg.type !== "string") return;

    if (msg.type === "connection_registered") {
      this.registered = true;
      this.failures = 0;
      this.setStatus("open");
      this.replay();
    } else if (msg.type === "ack" && typeof msg.event_key === "string") {
      this.removeFromOutbox(msg.event_key);
    } else if (msg.type === "error" && msg.code === "unauthorized") {
      // Do not retry with a bad token.
      this.halted = true;
    }

    this.listeners.get(msg.type)?.forEach((cb) => cb(msg));
    if (this.opts.emitBus !== false) emitSocketMessage(this.opts.name, msg as { type: string });

    if (this.halted) {
      this.close();
    }
  }

  private replay(): void {
    const q = this.readOutbox();
    for (const [key, item] of Object.entries(q)) {
      if (item.try >= this.maxTry) {
        // Give up: the server never acked it within MAX_TRY sends.
        delete q[key];
        continue;
      }
      item.try += 1;
      this.raw(item.payload);
    }
    this.writeOutbox(q);
  }

  private startTimers(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => this.raw({ action: "ping" }), this.pingIntervalMs);
    this.bumpStale();
  }

  private bumpStale(): void {
    if (this.staleTimer) clearTimeout(this.staleTimer);
    this.staleTimer = setTimeout(() => this.forceReconnect(), this.staleAfterMs);
  }

  private clearTimers(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.staleTimer) clearTimeout(this.staleTimer);
    this.pingTimer = null;
    this.staleTimer = null;
  }

  /** Detaches the current socket and clears its timers. Returns it so the caller can close it. */
  private teardown(): WebSocket | null {
    const ws = this.ws;
    this.ws = null;
    this.registered = false;
    this.clearTimers();
    return ws;
  }

  private handleClose(ws: WebSocket): void {
    if (this.ws !== ws) return; // already torn down
    this.teardown();
    this.onDisconnected();
  }

  private forceReconnect(): void {
    const ws = this.teardown();
    if (!ws) return;
    try {
      ws.close();
    } catch {
      /* ignore */
    }
    this.onDisconnected();
  }

  private onDisconnected(): void {
    if (this.closedByUser || this.halted) {
      this.setStatus("closed");
      return;
    }
    this.failures += 1;
    if (this.failures >= this.maxFailures) {
      this.setStatus("reconnect-exhausted");
      return;
    }
    this.setStatus("closed");
    const delay = Math.min(this.backoffMaxMs, this.backoffBaseMs * 2 ** (this.failures - 1));
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.closedByUser) this.openSocket();
    }, delay);
  }

  private raw(payload: unknown): void {
    const ws = this.ws;
    if (ws && ws.readyState === OPEN) ws.send(JSON.stringify(payload));
  }

  private setStatus(s: SocketStatus): void {
    this.status = s;
    this.statusListeners.forEach((cb) => cb(s));
    if (this.opts.emitBus !== false) emitSocketStatus(this.opts.name, s);
  }

  private readOutbox(): OutboxMap {
    if (!this.storage) return { ...this.memOutbox };
    try {
      const raw = this.storage.getItem(this.outboxKey);
      const parsed = raw ? (JSON.parse(raw) as unknown) : {};
      return isRecord(parsed) ? (parsed as OutboxMap) : {};
    } catch {
      return {};
    }
  }

  private writeOutbox(q: OutboxMap): void {
    if (!this.storage) {
      this.memOutbox = q;
      return;
    }
    try {
      this.storage?.setItem(this.outboxKey, JSON.stringify(q));
    } catch {
      /* quota exceeded: keep going without persistence */
    }
  }

  private removeFromOutbox(eventKey: string): void {
    const q = this.readOutbox();
    if (eventKey in q) {
      delete q[eventKey];
      this.writeOutbox(q);
    }
  }
}
