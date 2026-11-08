import { create } from "zustand";
import type { CreditsSummary } from "@pw/shared";
import { api, invalidate } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

export interface CreditsState {
  data: CreditsSummary | null;
  loading: boolean;
  error: string | null;
  /** GET /credits into the store. */
  refresh(): Promise<void>;
  /** Live balance from the "credits" socket message. null = unlimited. */
  setBalance(balance: number | null): void;
}

export const useCredits = create<CreditsState>()((set, get) => ({
  data: null,
  loading: false,
  error: null,
  async refresh() {
    set({ loading: true });
    try {
      const data = await api("GET /credits");
      set({ data, error: null });
      invalidate("GET /credits");
    } catch (e) {
      set({ error: errorMessage(e) });
    } finally {
      set({ loading: false });
    }
  },
  setBalance(balance) {
    const cur = get().data;
    if (cur) set({ data: { ...cur, balance } });
  },
}));
