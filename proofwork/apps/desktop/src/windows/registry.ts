// Tracks every live window so main-process services can fan events out without importing window modules.
import type { BrowserWindow, WebContents, WebContentsView } from "electron";
import type { OverlayKind, Surface } from "@pw/shared";

export const state: {
  main: BrowserWindow | null;
  appView: WebContentsView | null;
  overlays: Map<OverlayKind, BrowserWindow>;
} = {
  main: null,
  appView: null,
  overlays: new Map(),
};

/** Every live webContents: shell, app view and open overlays. */
export function liveContents(): WebContents[] {
  const out: WebContents[] = [];
  if (state.main && !state.main.isDestroyed()) out.push(state.main.webContents);
  if (state.appView && !state.appView.webContents.isDestroyed()) out.push(state.appView.webContents);
  for (const win of state.overlays.values()) {
    if (!win.isDestroyed()) out.push(win.webContents);
  }
  return out;
}

export function broadcast(channel: string, ...args: unknown[]): void {
  for (const wc of liveContents()) wc.send(channel, ...args);
}

export function broadcastExcept(except: WebContents, channel: string, ...args: unknown[]): void {
  for (const wc of liveContents()) {
    if (wc !== except) wc.send(channel, ...args);
  }
}

/** Which surface a webContents renders. The shell is reported as "main" because it belongs to the main window. */
export function surfaceOf(wc: WebContents): Surface | null {
  if (state.appView && wc === state.appView.webContents) return "main";
  if (state.main && wc === state.main.webContents) return "main";
  for (const [kind, win] of state.overlays) {
    if (!win.isDestroyed() && win.webContents === wc) return kind;
  }
  return null;
}

export function overlayKindOf(wc: WebContents): OverlayKind | null {
  for (const [kind, win] of state.overlays) {
    if (!win.isDestroyed() && win.webContents === wc) return kind;
  }
  return null;
}
