// /ws/notifications: reliable-socket envelope (auth first, ping/pong, event_key acks, pushed notifications).
import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { NotificationsServerMessage } from "@pw/shared";
import type { Core } from "../types.ts";
import { userIdFromToken } from "../services/auth.ts";
import { isObject } from "../validate.ts";

const OPEN = 1;
const AUTH_TIMEOUT_MS = 10_000;
const UNAUTHORIZED_CLOSE = 4401;

type Outbound = NotificationsServerMessage | { type: "ack"; event_key: string } | { type: "error"; code: string; message: string };

function rawToText(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (Buffer.isBuffer(raw)) return raw.toString("utf8");
  if (Array.isArray(raw)) return Buffer.concat(raw as Buffer[]).toString("utf8");
  return Buffer.from(raw as ArrayBuffer).toString("utf8");
}

export function registerNotificationsSocket(app: FastifyInstance, core: Core): void {
  app.get("/ws/notifications", { websocket: true }, (socket) => {
    let userId: string | null = null;
    let removeSender: (() => void) | null = null;

    const send = (msg: Outbound): void => {
      if (socket.readyState === OPEN) socket.send(JSON.stringify(msg));
    };
    const reject = (): void => {
      send({ type: "error", code: "unauthorized", message: "Authenticate with an auth frame first." });
      socket.close(UNAUTHORIZED_CLOSE, "unauthorized");
    };
    const ack = (eventKey: string): void => send({ type: "ack", event_key: eventKey });

    const authTimer = setTimeout(() => {
      if (!userId) reject();
    }, AUTH_TIMEOUT_MS);

    const handleAuth = async (frame: Record<string, unknown>): Promise<void> => {
      if (frame.action !== "auth" || typeof frame.token !== "string") return reject();
      const authed = await userIdFromToken(core, frame.token);
      if (!authed) return reject();
      if (socket.readyState !== OPEN) return;
      userId = authed;
      clearTimeout(authTimer);
      removeSender = core.hub.add(authed, (msg) => send(msg));
      const sessionId = typeof frame.session_id === "string" ? frame.session_id : randomUUID();
      send({ type: "connection_registered", session_id: sessionId });
    };

    const handleFrame = async (frame: Record<string, unknown>): Promise<void> => {
      if (!userId) return handleAuth(frame);
      if (typeof frame.event_key === "string") {
        ack(frame.event_key);
        if (core.hub.markSeen(userId, frame.event_key)) return;
      }
      if (frame.action === "ping") send({ type: "pong" });
    };

    socket.on("message", (raw: unknown) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawToText(raw));
      } catch {
        send({ type: "error", code: "bad_request", message: "Frames must be JSON." });
        return;
      }
      if (!isObject(parsed)) return;
      void handleFrame(parsed).catch((err: unknown) => core.log("notifications socket frame failed", { reason: String(err) }));
    });

    socket.on("close", () => {
      clearTimeout(authTimer);
      removeSender?.();
    });
  });
}

