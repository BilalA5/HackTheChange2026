import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReliableSocket } from "./ReliableSocket";

/** Fake WebSocket. The test drives open, close and inbound frames. */
class FakeWS {
  static instances: FakeWS[] = [];
  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(readonly url: string) {
    FakeWS.instances.push(this);
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    if (this.readyState === 3) return;
    this.readyState = 3;
    this.onclose?.();
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  serverSend(frame: unknown) {
    this.onmessage?.({ data: JSON.stringify(frame) });
  }
  frames(): Record<string, unknown>[] {
    return this.sent.map((s) => JSON.parse(s) as Record<string, unknown>);
  }
}

type Server = { type: "connection_registered"; session_id: string } | { type: "ack"; event_key: string } | { type: "pong" } | { type: "error"; code: string; message: string } | { type: "hello"; n: number };
type Client = { action: "user_text"; text: string } | { action: "ping" } | { action: "auth" };

const QUEUE_KEY = "/ws/test_events_queue";

async function flush() {
  for (let i = 0; i < 6; i++) await Promise.resolve();
}

function makeSocket(extra: Partial<ConstructorParameters<typeof ReliableSocket>[0]> = {}) {
  return new ReliableSocket<Server, Client>({
    name: "test",
    path: "/ws/test",
    baseUrl: () => "http://127.0.0.1:8787",
    auth: () => ({ token: "tok", session_id: "s1", device_id: "d1" }),
    WebSocketImpl: FakeWS as unknown as typeof WebSocket,
    emitBus: false,
    ...extra,
  });
}

/** Opens the latest socket, completes auth and registration. */
async function connectAndRegister(sock: ReliableSocket<Server, Client>) {
  const ws = FakeWS.instances[FakeWS.instances.length - 1];
  ws.open();
  await flush();
  ws.serverSend({ type: "connection_registered", session_id: "s1" });
  return ws;
}

describe("ReliableSocket", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeWS.instances = [];
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends the auth frame first and holds other frames until registration", async () => {
    const sock = makeSocket();
    sock.connect();
    const ws = FakeWS.instances[0];
    expect(ws.url).toBe("ws://127.0.0.1:8787/ws/test");

    sock.send({ action: "user_text", text: "early" });
    ws.open();
    await flush();

    expect(ws.frames()).toHaveLength(1);
    expect(ws.frames()[0]).toEqual({ action: "auth", token: "tok", session_id: "s1", device_id: "d1" });

    ws.serverSend({ type: "connection_registered", session_id: "s1" });
    const sentTexts = ws.frames().filter((f) => f.action === "user_text");
    expect(sentTexts).toHaveLength(1);
    expect(sentTexts[0].event_key).toEqual(expect.any(String));
  });

  it("stamps every sent frame with an event_key and removes it from the outbox on ack", async () => {
    const sock = makeSocket();
    sock.connect();
    const ws = await connectAndRegister(sock);

    const key = sock.send({ action: "user_text", text: "hi" });
    const frame = ws.frames().find((f) => f.event_key === key);
    expect(frame).toMatchObject({ action: "user_text", text: "hi" });

    const stored = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "{}") as Record<string, { try: number }>;
    expect(stored[key]).toMatchObject({ try: 1, status: "pending" });

    ws.serverSend({ type: "ack", event_key: key });
    expect(JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "{}")).toEqual({});
  });

  it("replays un-acked frames after a reconnect, with the same event_key", async () => {
    const sock = makeSocket();
    sock.connect();
    const first = await connectAndRegister(sock);
    const key = sock.send({ action: "user_text", text: "again" });
    expect(first.frames().some((f) => f.event_key === key)).toBe(true);

    first.close();
    vi.advanceTimersByTime(500);
    const second = await connectAndRegister(sock);

    const replayed = second.frames().filter((f) => f.event_key === key);
    expect(replayed).toHaveLength(1);
    expect(replayed[0].text).toBe("again");
  });

  it("does not replay a frame after it was acked", async () => {
    const sock = makeSocket();
    sock.connect();
    const first = await connectAndRegister(sock);
    const key = sock.send({ action: "user_text", text: "done" });
    first.serverSend({ type: "ack", event_key: key });

    first.close();
    vi.advanceTimersByTime(500);
    const second = await connectAndRegister(sock);
    expect(second.frames().some((f) => f.event_key === key)).toBe(false);
  });

  it("sends an item at most MAX_TRY (3) times, then drops it", async () => {
    const sock = makeSocket();
    sock.connect();
    let ws = await connectAndRegister(sock);
    const key = sock.send({ action: "user_text", text: "never acked" });

    // Sends so far: 1 (live). Each reconnect replays once more: 2, 3. The next replay must drop it.
    for (let i = 0; i < 2; i++) {
      ws.close();
      vi.advanceTimersByTime(500);
      ws = await connectAndRegister(sock);
      expect(ws.frames().some((f) => f.event_key === key)).toBe(true);
    }

    ws.close();
    vi.advanceTimersByTime(500);
    ws = await connectAndRegister(sock);
    expect(ws.frames().some((f) => f.event_key === key)).toBe(false);
    expect(JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "{}")).toEqual({});
  });

  it("forces a reconnect after 40 s without inbound frames and keeps pinging every 15 s", async () => {
    const sock = makeSocket();
    sock.connect();
    const ws = await connectAndRegister(sock);

    vi.advanceTimersByTime(15_000);
    expect(ws.frames().some((f) => f.action === "ping")).toBe(true);

    // Inbound frames reset the stale timer. The pong at 15 s moves the deadline to 55 s.
    ws.serverSend({ type: "pong" });
    vi.advanceTimersByTime(30_000);
    expect(FakeWS.instances).toHaveLength(1);

    // Now at 45 s. The pong at 15 s moved the stale deadline to 55 s. One ms before it: still connected.
    vi.advanceTimersByTime(9_999);
    expect(FakeWS.instances).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(sock.getStatus()).toBe("closed");
    vi.advanceTimersByTime(500);
    expect(FakeWS.instances).toHaveLength(2);
  });

  it("backs off from 500 ms and reports reconnect-exhausted after 8 failures", () => {
    const sock = makeSocket();
    const statuses: string[] = [];
    sock.onStatus((s) => statuses.push(s));
    sock.connect();

    // Never registers: close each attempt.
    FakeWS.instances[0].close();
    vi.advanceTimersByTime(499);
    expect(FakeWS.instances).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(FakeWS.instances).toHaveLength(2);

    for (let i = 0; i < 7; i++) {
      FakeWS.instances[FakeWS.instances.length - 1].close();
      vi.advanceTimersByTime(30_000);
    }
    expect(FakeWS.instances).toHaveLength(8);
    expect(sock.getStatus()).toBe("reconnect-exhausted");
    expect(statuses[statuses.length - 1]).toBe("reconnect-exhausted");
  });

  it("delivers typed inbound frames to on() subscribers", async () => {
    const sock = makeSocket();
    const seen: number[] = [];
    sock.on("hello", (m) => seen.push(m.n));
    sock.connect();
    const ws = await connectAndRegister(sock);
    ws.serverSend({ type: "hello", n: 7 });
    expect(seen).toEqual([7]);
  });

  it("close() stops reconnecting", async () => {
    const sock = makeSocket();
    sock.connect();
    const ws = await connectAndRegister(sock);
    sock.close();
    expect(ws.readyState).toBe(3);
    vi.advanceTimersByTime(60_000);
    expect(FakeWS.instances).toHaveLength(1);
  });
});
