// Main window: a frameless-looking window with the 44px shell titlebar (shell.html) and the app in a WebContentsView below it.
import { BrowserWindow, WebContentsView, shell } from "electron";
import { IPC } from "@pw/shared";
import { config, rendererOrigin } from "../config.ts";
import { log } from "../log.ts";
import { state } from "./registry.ts";
import { closeAllOverlays } from "./overlays.ts";
import { pathToFileURL } from "node:url";
import { isAllowedNavigation } from "./navigation.ts";
import { webPreferencesFor } from "./webPrefs.ts";

export const SHELL_HEIGHT = 44;
export const TITLEBAR_ACTIONS = ["back", "credits", "notifications", "support"] as const;

export interface TitlebarState {
  title?: string;
  credits?: number | null;
  level?: number;
  canGoBack?: boolean;
}

let titlebar: TitlebarState = { title: "Proofwork", credits: null, level: 0, canGoBack: false };

export function shellUrl(): string {
  return pathToFileURL(config.shellHtmlPath).href;
}

export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#0F1115",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 15 },
    show: !config.smoke,
    title: "Proofwork",
    webPreferences: webPreferencesFor(),
  });
  state.main = win;

  const view = new WebContentsView({ webPreferences: webPreferencesFor() });
  state.appView = view;
  win.contentView.addChildView(view);
  layout(win, view);

  const relayout = () => layout(win, view);
  win.on("resize", relayout);
  win.on("maximize", relayout);
  win.on("unmaximize", relayout);
  win.on("enter-full-screen", relayout);
  win.on("leave-full-screen", relayout);

  guardExternalNavigation(view);
  guardShell(win);

  win.webContents.on("did-finish-load", () => sendTitlebarState());
  win.loadFile(config.shellHtmlPath).catch((err: unknown) => log.error(`shell load failed: ${String(err)}`));
  view.webContents.loadURL(`${config.rendererUrl}/?surface=main`).catch((err: unknown) => {
    log.error(`app view load failed: ${String(err)}`);
  });

  win.on("closed", () => {
    state.main = null;
    state.appView = null;
    closeAllOverlays();
  });
  return win;
}

function layout(win: BrowserWindow, view: WebContentsView): void {
  if (win.isDestroyed() || view.webContents.isDestroyed()) return;
  const [width, height] = win.getContentSize();
  view.setBounds({ x: 0, y: SHELL_HEIGHT, width, height: Math.max(0, height - SHELL_HEIGHT) });
}

function guardExternalNavigation(view: WebContentsView): void {
  const wc = view.webContents;
  wc.setWindowOpenHandler(({ url }) => {
    openExternalSafe(url);
    return { action: "deny" };
  });
  wc.on("will-navigate", (event, url) => {
    if (isAllowedNavigation(url, rendererOrigin)) return;
    event.preventDefault();
    openExternalSafe(url);
  });
}

function guardShell(win: BrowserWindow): void {
  const wc = win.webContents;
  wc.setWindowOpenHandler(({ url }) => {
    openExternalSafe(url);
    return { action: "deny" };
  });
  wc.on("will-navigate", (event, url) => {
    if (url !== shellUrl()) event.preventDefault();
  });
}

function openExternalSafe(url: string): void {
  try {
    const parsed = new URL(url);
    if (["http:", "https:", "mailto:"].includes(parsed.protocol)) void shell.openExternal(parsed.href);
  } catch {
    // ignore unparseable URLs
  }
}

/** Shell titlebar state: pushed by the app view via pw.window.setTitlebar and replayed to the shell after it loads. */
export function setTitlebar(partial: TitlebarState): void {
  titlebar = { ...titlebar, ...partial };
  sendTitlebarState();
}

function sendTitlebarState(): void {
  if (state.main && !state.main.isDestroyed() && !state.main.webContents.isLoading()) {
    state.main.webContents.send(IPC.window.titlebarState, titlebar);
  }
}

export function forwardTitlebarAction(action: string): void {
  if (state.appView && !state.appView.webContents.isDestroyed()) {
    state.appView.webContents.send(IPC.window.titlebarAction, action);
  }
}

/** Shows the main window (re-creating it on mac after it was closed) and optionally navigates the app view. */
export function focusMain(route?: string): void {
  let win = state.main;
  if (!win || win.isDestroyed()) win = createMainWindow();
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  if (route && state.appView) {
    const wc = state.appView.webContents;
    const send = () => wc.send(IPC.window.navigate, route);
    if (wc.isLoading()) wc.once("did-finish-load", send);
    else send();
  }
}

export function mainWindow(): BrowserWindow | null {
  return state.main && !state.main.isDestroyed() ? state.main : null;
}
