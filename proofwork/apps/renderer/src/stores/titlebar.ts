import { create } from "zustand";

export interface TitlebarState {
  title: string;
  /** Credit balance shown in the pill. null = unlimited plan, undefined = not loaded yet. */
  credits: number | null | undefined;
  level: number | undefined;
  canGoBack: boolean;
  /** Merge a partial update (undefined fields are left unchanged). */
  patch(p: { title?: string; credits?: number | null; level?: number; canGoBack?: boolean }): void;
}

/** Titlebar state. In Electron it mirrors the native shell via pw.window.setTitlebar; in the web build WebTitlebar renders it. */
export const useTitlebar = create<TitlebarState>()((set) => ({
  title: "Proofwork",
  credits: undefined,
  level: undefined,
  canGoBack: false,
  patch(p) {
    set((prev) => ({
      title: p.title ?? prev.title,
      credits: p.credits !== undefined ? p.credits : prev.credits,
      level: p.level ?? prev.level,
      canGoBack: p.canGoBack ?? prev.canGoBack,
    }));
  },
}));
