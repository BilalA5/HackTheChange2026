// Overlay windows (PiP, HUD, island, cowork, record bar, camera, region). One BrowserWindow per OverlayKind, created lazily.
import { BrowserWindow, screen, type Rectangle, type WebContents } from "electron";
import { IPC, OVERLAY_DEFAULTS, SURFACES, type OverlayKind } from "@pw/shared";
import { config, rendererOrigin } from "../config.ts";
import { log, errorMessage } from "../log.ts";
import { state, broadcastExcept, overlayKindOf } from "./registry.ts";
import { webPreferencesFor } from "./webPrefs.ts";
import { isAllowedNavigation } from "./navigation.ts";

export const OVERLAY_KINDS = SURFACES.filter((s): s is OverlayKind => s !== "main");
const MARGIN = 16;
const payloads = new Map<OverlayKind, unknown>();

/** Places a w×h rectangle inside the work area using the anchor from OVERLAY_DEFAULTS. */
export function placeAnchored(area: Rectangle, anchor: string, w: number, h: number): Rectangle {
  let x = area.x + Math.round((area.width - w) / 2);
  let y = area.y + Math.round((area.height - h) / 2);
  if (anchor === "top-center" || anchor === "top-right") y = area.y + MARGIN;
  if (anchor === "bottom-center" || anchor === "bottom-right") y = area.y + area.height - h - MARGIN;
  if (anchor === "top-right" || anchor === "bottom-right") x = area.x + area.width - w - MARGIN;
  return { x, y, width: w, height: h };
}

export function overlayBounds(kind: OverlayKind): Rectangle {
  const def = OVERLAY_DEFAULTS[kind];
  const display = screen.getPrimaryDisplay();
  if (def.anchor === "fullscreen") {
    return { x: display.bounds.x, y: display.bounds.y, width: display.bounds.width, height: display.bounds.height };
  }
  return placeAnchored(display.workArea, def.anchor, def.width, def.height);
}

export function ensureOverlay(kind: OverlayKind): BrowserWindow {
  const existing = state.overlays.get(kind);
  if (existing && !existing.isDestroyed()) return existing;

  const def = OVERLAY_DEFAULTS[kind];
  const mac = process.platform === "darwin";
  const win = new BrowserWindow({
    ...overlayBounds(kind),
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    resizable: false,
    // PiP, record bar and camera bubble can be dragged by their -webkit-app-region: drag areas.
    movable: !def.clickThrough && def.anchor !== "fullscreen",
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: def.focusable,
    alwaysOnTop: true,
    ...(mac ? { type: "panel" as const, hiddenInMissionControl: true } : {}),
    webPreferences: webPreferencesFor(),
  });

  win.setContentProtection(true); // never captured by screenshots or screen share
  win.setAlwaysOnTop(true, mac ? "floating" : "screen-saver");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  if (def.clickThrough) win.setIgnoreMouseEvents(true, { forward: true });
  win.on("always-on-top-changed", (_e, on) => {
    if (!on) win.setAlwaysOnTop(true, mac ? "floating" : "screen-saver");
  });

  const wc = win.webContents;
  wc.setWindowOpenHandler(() => {
    log.info(`overlay ${kind} tried to open a window; denied`);
    return { action: "deny" };
  });
  wc.on("will-navigate", (event, url) => {
    if (!isAllowedNavigation(url, rendererOrigin)) event.preventDefault();
  });
  wc.on("did-finish-load", () => {
    if (payloads.has(kind)) wc.send(IPC.overlay.payload, payloads.get(kind));
  });

  win.on("closed", () => {
    if (state.overlays.get(kind) === win) state.overlays.delete(kind);
  });

  state.overlays.set(kind, win);
  win.loadURL(`${config.rendererUrl}/?surface=${kind}`).catch((err: unknown) => {
    log.error(`overlay ${kind} load failed: ${errorMessage(err)}`);
  });
  return win;
}

export function openOverlay(kind: OverlayKind, payload?: unknown): void {
  const win = ensureOverlay(kind);
  if (payload !== undefined) payloads.set(kind, payload);
  if (!win.isVisible()) {
    if (OVERLAY_DEFAULTS[kind].focusable) win.show();
    else win.showInactive();
  }
  if (payload !== undefined && !win.webContents.isLoading()) {
    win.webContents.send(IPC.overlay.payload, payload);
  }
}

export function closeOverlay(kind: OverlayKind): void {
  const win = state.overlays.get(kind);
  if (win && !win.isDestroyed()) win.hide();
}

export function isOverlayOpen(kind: OverlayKind): boolean {
  const win = state.overlays.get(kind);
  return !!win && !win.isDestroyed() && win.isVisible();
}

export function closeAllOverlays(): void {
  for (const kind of OVERLAY_KINDS) closeOverlay(kind);
}

export function getPayloadFor(wc: WebContents): unknown {
  const kind = overlayKindOf(wc);
  return kind ? (payloads.get(kind) ?? null) : null;
}

export function setPayload(kind: OverlayKind, payload: unknown): void {
  payloads.set(kind, payload);
  const win = state.overlays.get(kind);
  if (win && !win.isDestroyed() && !win.webContents.isLoading()) {
    win.webContents.send(IPC.overlay.payload, payload);
  }
}

export function setIgnoreMouseFor(wc: WebContents, ignore: boolean): void {
  const kind = overlayKindOf(wc);
  const win = kind ? state.overlays.get(kind) : undefined;
  if (win && !win.isDestroyed()) win.setIgnoreMouseEvents(ignore, { forward: true });
}

export function resizeOverlayFor(wc: WebContents, width: number, height: number): void {
  const kind = overlayKindOf(wc);
  if (!kind) return;
  const def = OVERLAY_DEFAULTS[kind];
  const win = state.overlays.get(kind);
  if (!win || win.isDestroyed() || def.anchor === "fullscreen") return;
  const display = screen.getPrimaryDisplay();
  const w = Math.min(Math.max(1, Math.round(width)), display.workArea.width);
  const h = Math.min(Math.max(1, Math.round(height)), display.workArea.height);
  win.setBounds(placeAnchored(display.workArea, def.anchor, w, h));
}

/** Relays {from, channel, data} to every window except the sender. */
export function broadcastFrom(sender: WebContents, channel: string, data: unknown): void {
  const from = sender === state.main?.webContents || sender === state.appView?.webContents ? "main" : (overlayKindOf(sender) ?? "main");
  broadcastExcept(sender, IPC.overlay.message, { from, channel, data });
}
