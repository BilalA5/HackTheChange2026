import { create } from "zustand";

export type ToastTone = "neutral" | "success" | "xp" | "warning" | "danger";

export interface ToastOptions {
  title: string;
  body?: string;
  tone?: ToastTone;
  /** Auto-dismiss delay. Default 4000 ms. */
  ttlMs?: number;
}

export interface ToastItem extends Required<Pick<ToastOptions, "title" | "tone" | "ttlMs">> {
  id: number;
  body?: string;
}

interface ToastsState {
  items: ToastItem[];
  add(o: ToastOptions): number;
  dismiss(id: number): void;
}

let seq = 0;

export const useToasts = create<ToastsState>()((set, get) => ({
  items: [],
  add(o) {
    seq += 1;
    const item: ToastItem = { id: seq, title: o.title, body: o.body, tone: o.tone ?? "neutral", ttlMs: o.ttlMs ?? 4000 };
    set({ items: [...get().items.slice(-4), item] });
    return seq;
  },
  dismiss(id) {
    set({ items: get().items.filter((i) => i.id !== id) });
  },
}));

/** Shows a toast. Render the <Toaster/> once (App and every overlay surface do). */
export function toast(o: ToastOptions): number {
  return useToasts.getState().add(o);
}
