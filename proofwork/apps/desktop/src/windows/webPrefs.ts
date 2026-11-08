// Shared webPreferences for every window: isolated, sandboxed, no Node in renderers.
import type { BrowserWindowConstructorOptions } from "electron";
import { config } from "../config.ts";

export function webPreferencesFor(): NonNullable<BrowserWindowConstructorOptions["webPreferences"]> {
  return {
    preload: config.preloadPath,
    contextIsolation: true,
    sandbox: true,
    nodeIntegration: false,
    webSecurity: true,
    spellcheck: false,
    // The co-worker island and kickoff narration speak without a click in that window.
    autoplayPolicy: "no-user-gesture-required",
  };
}
