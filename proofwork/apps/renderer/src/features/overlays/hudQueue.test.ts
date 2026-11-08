import { describe, expect, it } from "vitest";
import { EMPTY_HUD, HUD_MAX_QUEUE, hudAdvance, hudEnqueue, makeNotice } from "./hudQueue";

const n = (id: number) => makeNotice({ title: `notice ${id}` }, id);

describe("HUD queue", () => {
  it("shows the first notice straight away", () => {
    const s = hudEnqueue(EMPTY_HUD, n(1));
    expect(s.current?.id).toBe(1);
    expect(s.queue).toEqual([]);
  });

  it("queues later notices behind the visible one, in order", () => {
    let s = hudEnqueue(EMPTY_HUD, n(1));
    s = hudEnqueue(s, n(2));
    s = hudEnqueue(s, n(3));
    expect(s.current?.id).toBe(1);
    expect(s.queue.map((x) => x.id)).toEqual([2, 3]);
  });

  it("advances through the queue and goes idle when it is empty", () => {
    let s = hudEnqueue(EMPTY_HUD, n(1));
    s = hudEnqueue(s, n(2));
    s = hudAdvance(s);
    expect(s.current?.id).toBe(2);
    s = hudAdvance(s);
    expect(s.current).toBeNull();
    expect(s.queue).toEqual([]);
  });

  it("drops the oldest waiting notices past the cap", () => {
    let s = hudEnqueue(EMPTY_HUD, n(0));
    for (let i = 1; i <= HUD_MAX_QUEUE + 2; i += 1) s = hudEnqueue(s, n(i));
    expect(s.queue).toHaveLength(HUD_MAX_QUEUE);
    expect(s.queue[0].id).toBe(3);
    expect(s.queue.at(-1)?.id).toBe(HUD_MAX_QUEUE + 2);
    expect(s.current?.id).toBe(0);
  });

  it("does not mutate the previous state", () => {
    const before = hudEnqueue(EMPTY_HUD, n(1));
    hudEnqueue(before, n(2));
    expect(before.queue).toEqual([]);
  });

  it("defaults the tone to neutral and keeps the body", () => {
    expect(makeNotice({ title: "a" }, 9)).toEqual({ id: 9, title: "a", tone: "neutral" });
    expect(makeNotice({ title: "a", body: "b", tone: "xp" }, 9)).toEqual({ id: 9, title: "a", body: "b", tone: "xp" });
  });
});
