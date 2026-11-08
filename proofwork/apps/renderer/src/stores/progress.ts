import { create } from "zustand";
import type { Progress } from "@pw/shared";
import { api, invalidate } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

export interface ProgressState {
  data: Progress | null;
  loading: boolean;
  error: string | null;
  /** GET /progress into the store. Also re-fetches useApi("GET /progress") consumers. */
  refresh(): Promise<void>;
}

export const useProgress = create<ProgressState>()((set) => ({
  data: null,
  loading: false,
  error: null,
  async refresh() {
    set({ loading: true });
    try {
      const data = await api("GET /progress");
      set({ data, error: null });
      invalidate("GET /progress");
    } catch (e) {
      set({ error: errorMessage(e) });
    } finally {
      set({ loading: false });
    }
  },
}));
