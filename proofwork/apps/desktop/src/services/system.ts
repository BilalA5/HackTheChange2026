// App-level system calls: info, external links, launch at login, relaunch and quit.
import { app } from "electron";
import { APP_NAME, type AppInfo } from "@pw/shared";
import { config } from "../config.ts";
import { log } from "../log.ts";

export function appInfo(): AppInfo {
  const platform = process.platform;
  return {
    name: APP_NAME,
    version: app.getVersion(),
    channel: config.channel,
    platform: platform === "darwin" || platform === "win32" || platform === "linux" ? platform : "linux",
    rendererUrl: config.rendererUrl,
    serverUrl: config.serverUrl,
    electron: process.versions.electron ?? null,
    chrome: process.versions.chrome ?? null,
    isPackaged: config.isPackaged,
  };
}

export function setLaunchAtLogin(on: boolean): void {
  if (!config.isPackaged) {
    // Registering the dev Electron binary as a login item would launch Electron itself at login.
    log.warn("launch at login is only available in packaged builds");
    return;
  }
  app.setLoginItemSettings({ openAtLogin: on });
}

export function getLaunchAtLogin(): boolean {
  return config.isPackaged && app.getLoginItemSettings().openAtLogin;
}
