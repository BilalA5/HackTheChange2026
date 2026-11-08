import { create } from "zustand";
import type { OverlayKind } from "@pw/shared";

export interface OverlayItem {
  kind: OverlayKind;
  /** Bumps on every open so React remounts the iframe. */
  id: number;
  payload: unknown;
}

interface OverlayHostState {
  items: OverlayItem[];
  open(kind: OverlayKind, payload?: unknown): void;
  close(kind: OverlayKind): void;
  setPayload(kind: OverlayKind, payload: unknown): void;
  isOpen(kind: OverlayKind): boolean;
}

let seq = 0;

/** Web-only simulation of overlay windows. The Electron build never uses this store. */
export const useOverlayHost = create<OverlayHostState>()((set, get) => ({
  items: [],
  open(kind, payload) {
    const existing = get().items.find((i) => i.kind === kind);
    if (existing) {
      set({ items: get().items.map((i) => (i.kind === kind ? { ...i, payload } : i)) });
      return;
    }
    seq += 1;
    set({ items: [...get().items, { kind, id: seq, payload: payload ?? null }] });
  },
  close(kind) {
    set({ items: get().items.filter((i) => i.kind !== kind) });
  },
  setPayload(kind, payload) {
    set({ items: get().items.map((i) => (i.kind === kind ? { ...i, payload } : i)) });
  },
  isOpen(kind) {
    return get().items.some((i) => i.kind === kind);
  },
}));
