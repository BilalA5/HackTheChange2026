import { create } from "zustand";

export const PANEL_NAMES = [
  "settings",
  "credits",
  "notifications",
  "bug",
  "support",
  "coach",
  "xp",
  "vision",
] as const;
export type PanelName = (typeof PANEL_NAMES)[number];

/** Every panel receives onClose plus its own optional props (e.g. SettingsModal reads `initialTab`). */
export type PanelProps = { onClose: () => void } & Record<string, unknown>;

export interface OpenPanel {
  name: PanelName;
  props?: Record<string, unknown>;
}

interface UiState {
  panel: OpenPanel | null;
  openPanel(name: PanelName, props?: Record<string, unknown>): void;
  closePanel(): void;
}

export const useUi = create<UiState>()((set) => ({
  panel: null,
  openPanel(name, props) {
    set({ panel: props ? { name, props } : { name } });
  },
  closePanel() {
    set({ panel: null });
  },
}));
