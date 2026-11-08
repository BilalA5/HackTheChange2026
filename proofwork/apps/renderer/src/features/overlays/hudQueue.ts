import type { HudInput, HudTone } from "./overlayMessages";

/*
 * HUD notice queue. One toast is visible at a time; later notices wait in line. When the line grows past
 * the cap, the oldest waiting notices are dropped so a burst cannot pile up forever.
 */

export const HUD_TTL_MS = 4000;
export const HUD_MAX_QUEUE = 5;

export interface HudNotice {
  id: number;
  title: string;
  body?: string;
  tone: HudTone;
}

export interface HudState {
  current: HudNotice | null;
  queue: HudNotice[];
}

export const EMPTY_HUD: HudState = { current: null, queue: [] };

let seq = 0;

export function makeNotice(input: HudInput, id: number = (seq += 1)): HudNotice {
  const notice: HudNotice = { id, title: input.title, tone: input.tone ?? "neutral" };
  if (input.body !== undefined) notice.body = input.body;
  return notice;
}

/** Shows the notice straight away when the HUD is idle, otherwise queues it (keeping at most `cap` waiting). */
export function hudEnqueue(state: HudState, notice: HudNotice, cap: number = HUD_MAX_QUEUE): HudState {
  if (state.current === null) return { current: notice, queue: state.queue };
  const queue = [...state.queue, notice];
  return { current: state.current, queue: queue.length > cap ? queue.slice(queue.length - cap) : queue };
}

/** Called when the visible notice times out: the next waiting notice takes over, or the HUD goes idle. */
export function hudAdvance(state: HudState): HudState {
  const [next, ...rest] = state.queue;
  return { current: next ?? null, queue: rest };
}
