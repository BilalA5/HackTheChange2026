/*
 * Typed-by-convention window CustomEvent bus for socket traffic.
 *   se:<socket>:message            every inbound frame, detail = frame
 *   se:<socket>:message:<type>     only frames of one type
 *   se:<socket>:status             detail = SocketStatus
 * Components can subscribe without prop drilling via onSocketMessage().
 */
import type { SocketStatus } from "./ReliableSocket";

export function socketEventName(socket: string, kind: "message" | "status", type?: string): string {
  return type ? `se:${socket}:${kind}:${type}` : `se:${socket}:${kind}`;
}

export function emitSocketMessage(socket: string, msg: { type: string }): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(socketEventName(socket, "message"), { detail: msg }));
  window.dispatchEvent(new CustomEvent(socketEventName(socket, "message", msg.type), { detail: msg }));
}

export function emitSocketStatus(socket: string, status: SocketStatus): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(socketEventName(socket, "status"), { detail: status }));
}

/** Subscribes to one message type. Returns an unsubscribe function. */
export function onSocketMessage<M extends { type: string }, K extends M["type"] = M["type"]>(
  socket: string,
  type: K,
  cb: (msg: Extract<M, { type: K }>) => void,
): () => void {
  const name = socketEventName(socket, "message", type);
  const handler = (e: Event) => cb((e as CustomEvent<Extract<M, { type: K }>>).detail);
  window.addEventListener(name, handler);
  return () => window.removeEventListener(name, handler);
}

export function onSocketStatus(socket: string, cb: (status: SocketStatus) => void): () => void {
  const name = socketEventName(socket, "status");
  const handler = (e: Event) => cb((e as CustomEvent<SocketStatus>).detail);
  window.addEventListener(name, handler);
  return () => window.removeEventListener(name, handler);
}
