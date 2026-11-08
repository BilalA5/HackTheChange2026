// Notifications socket, owned by the main process so it survives renderer reloads.
// Protocol (packages/shared/src/ws.ts): first frame {action:"auth"}, ping every 15 s, reconnect after 40 s of silence,
// exponential back-off 500 ms → 30 s.
import { randomUUID } from "node:crypto";
import { RELIABLE_SOCKET, WS_PATHS, type NotificationItem, type NotificationsServerMessage, type StoredSession } from "@pw/shared";
import { log, errorMessage } from "../log.ts";

export interface NotificationsDeps {
  serverUrl: string;
  deviceId: string;
  onMessage(msg: NotificationsServerMessage): void;
  onNotification(item: NotificationItem): void;
}

const { PING_INTERVAL_MS, STALE_AFTER_MS, BACKOFF_BASE_MS, BACKOFF_MAX_MS } = RELIABLE_SOCKET;

export class NotificationsClient {
  private readonly sessionId = randomUUID();
  private session: StoredSession | null = null;
  private socket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private staleTimer: NodeJS.Timeout | null = null;
  private backoff: number = BACKOFF_BASE_MS;
  private lastInbound = 0;
  private active = false;

  constructor(private readonly deps: NotificationsDeps) {}

  /** Called on login, token refresh and logout. A token change re-authenticates; no session disconnects. */
  setSession(session: StoredSession | null): void {
    const tokenChanged = session?.token !== this.session?.token;
    this.session = session;
    if (!session) {
      this.disconnect();
      return;
    }
    if (tokenChanged || !this.active) {
      this.disconnect();
      this.active = true;
      this.connect();
    }
  }

  disconnect(): void {
    this.active = false;
    this.clearTimers();
    this.teardownSocket();
    this.backoff = BACKOFF_BASE_MS;
  }

  private wsUrl(): string {
    const base = this.deps.serverUrl.replace(/^http/, "ws");
    const params = new URLSearchParams({ session_id: this.sessionId, device_id: this.deps.deviceId });
    return `${base}${WS_PATHS.notifications}?${params.toString()}`;
  }

  private connect(): void {
    if (!this.active || !this.session) return;
    let socket: WebSocket;
    try {
      socket = new WebSocket(this.wsUrl());
    } catch (err) {
      log.warn(`notifications socket could not be created: ${errorMessage(err)}`);
      this.scheduleReconnect();
      return;
    }
    this.socket = socket;
    this.lastInbound = Date.now();

    socket.onopen = () => {
      const session = this.session;
      if (!session || this.socket !== socket) return;
      // The token is sent only in the first frame, never in the URL.
      socket.send(
        JSON.stringify({ action: "auth", token: session.token, session_id: this.sessionId, device_id: this.deps.deviceId }),
      );
      this.lastInbound = Date.now();
      this.startTimers(socket);
    };

    socket.onmessage = (event: MessageEvent) => {
      if (this.socket !== socket) return;
      this.lastInbound = Date.now();
      let msg: NotificationsServerMessage;
      try {
        msg = JSON.parse(String(event.data)) as NotificationsServerMessage;
      } catch {
        return;
      }
      if (msg.type === "connection_registered") this.backoff = BACKOFF_BASE_MS;
      if (msg.type === "notification") this.deps.onNotification(msg.item);
      this.deps.onMessage(msg);
    };

    socket.onclose = () => {
      if (this.socket !== socket) return;
      this.socket = null;
      this.clearTimers();
      if (this.active) this.scheduleReconnect();
    };
    socket.onerror = () => {
      // The close event follows and drives the reconnect.
    };
  }

  private startTimers(socket: WebSocket): void {
    this.clearTimers();
    this.pingTimer = setInterval(() => {
      if (this.socket === socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ action: "ping" }));
      }
    }, PING_INTERVAL_MS);
    this.staleTimer = setInterval(() => {
      if (this.socket === socket && Date.now() - this.lastInbound > STALE_AFTER_MS) {
        log.warn("notifications socket went silent; reconnecting");
        this.teardownSocket();
        this.scheduleReconnect();
      }
    }, 5_000);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || !this.active) return;
    const delay = this.backoff;
    this.backoff = Math.min(this.backoff * 2, BACKOFF_MAX_MS);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private clearTimers(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.staleTimer) clearInterval(this.staleTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.pingTimer = null;
    this.staleTimer = null;
    this.reconnectTimer = null;
  }

  private teardownSocket(): void {
    const socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onclose = null;
      socket.onerror = null;
      try {
        socket.close(1000, "client");
      } catch {
        // already closed
      }
    }
  }
}
