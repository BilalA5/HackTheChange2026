import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { captureContext, createCoworkClient, reduceCoworkMessage, initialCoworkState } from "./cowork";

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
  send(d: string) {
    this.sent.push(d);
  }
  close() {
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

async function flush() {
  for (let i = 0; i < 6; i++) await Promise.resolve();
}

describe("cowork client", () => {
  beforeEach(() => {
    FakeWS.instances = [];
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function setup() {
    const client = createCoworkClient({
      objectiveId: "obj-1",
      stageId: "stage-1",
      mode: "do",
      learnerName: "Ada",
      WebSocketImpl: FakeWS as unknown as typeof WebSocket,
      baseUrl: () => "http://127.0.0.1:8787",
      storage: null,
    });
    client.connect();
    const ws = FakeWS.instances[0];
    return { client, ws };
  }

  it("sends init after registration and assembles streamed text_delta into one message", async () => {
    const { client, ws } = setup();
    ws.open();
    await flush();
    ws.serverSend({ type: "connection_registered", session_id: "x" });

    const init = ws.frames().find((f) => f.action === "init");
    expect(init).toMatchObject({ objectiveId: "obj-1", stageId: "stage-1", mode: "do", learnerName: "Ada" });

    ws.serverSend({ type: "session_ready", npcName: "Priya", npcRole: "Lead", budgetMinutes: 20, mode: "do" });
    ws.serverSend({ type: "thinking", filler: "Looking at the ticket" });
    ws.serverSend({ type: "text_delta", turn_id: "t1", delta: "Hel" });
    ws.serverSend({ type: "text_delta", turn_id: "t1", delta: "lo, " });
    ws.serverSend({ type: "text_delta", turn_id: "t1", delta: "Ada." });

    let state = client.getState();
    const streaming = state.messages.filter((m) => m.role === "npc");
    expect(streaming).toHaveLength(1);
    expect(streaming[0]).toMatchObject({ id: "t1", text: "Hello, Ada.", streaming: true });
    expect(state.thinking).toBe(false);
    expect(state.ready?.npcName).toBe("Priya");

    ws.serverSend({ type: "text_response", turn_id: "t1", text: "Hello, Ada. Let's start." });
    state = client.getState();
    const npc = state.messages.filter((m) => m.role === "npc");
    expect(npc).toHaveLength(1);
    expect(npc[0]).toMatchObject({ text: "Hello, Ada. Let's start.", streaming: false });
  });

  it("adds learner messages immediately and sends user_text frames", async () => {
    const { client, ws } = setup();
    ws.open();
    await flush();
    ws.serverSend({ type: "connection_registered", session_id: "x" });

    const key = client.sendText("Where do I start?", { windowTitle: "Ticket queue" });
    const sent = ws.frames().find((f) => f.event_key === key);
    expect(sent).toMatchObject({ action: "user_text", text: "Where do I start?", windowTitle: "Ticket queue" });
    expect(client.getState().messages.at(-1)).toMatchObject({ id: key, role: "learner", text: "Where do I start?" });
  });

  it("folds todos, xp, credits and session_end into state, and typed on() sees raw frames", async () => {
    const { client, ws } = setup();
    const types: string[] = [];
    client.on("xp", (m) => types.push(`xp:${m.amount}`));
    ws.open();
    await flush();
    ws.serverSend({ type: "connection_registered", session_id: "x" });

    ws.serverSend({ type: "todos", items: [{ id: "a", text: "Triage", done: false }] });
    ws.serverSend({ type: "xp", amount: 40, reason: "Good call" });
    ws.serverSend({ type: "xp", amount: 10, reason: "Tidy" });
    ws.serverSend({ type: "credits", balance: 9000 });
    ws.serverSend({ type: "session_end", reason: "learner_ended", summary: "Nice work" });

    const state = client.getState();
    expect(state.todos).toEqual([{ id: "a", text: "Triage", done: false }]);
    expect(state.xpEarned).toBe(50);
    expect(state.credits).toEqual({ balance: 9000 });
    expect(state.ended).toEqual({ reason: "learner_ended", summary: "Nice work" });
    expect(types).toEqual(["xp:40", "xp:10"]);
  });

  it("captureContext returns an empty object when screen capture is unavailable", async () => {
    await expect(captureContext()).resolves.toEqual({});
  });
});

describe("reduceCoworkMessage", () => {
  it("creates a message from text_response when no deltas arrived", () => {
    const next = reduceCoworkMessage(initialCoworkState("plan"), { type: "text_response", turn_id: "z", text: "Hi" }, 5);
    expect(next.messages).toEqual([{ id: "z", role: "npc", text: "Hi", streaming: false, at: 5 }]);
  });

  it("switches mode on mode_change frames", () => {
    const next = reduceCoworkMessage(initialCoworkState("plan"), { type: "mode_change", mode: "learn" });
    expect(next.mode).toBe("learn");
  });
});
