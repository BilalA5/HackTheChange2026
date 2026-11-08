import type { PwBridge } from "@pw/shared";
import { createWebBridge } from "./web-bridge";

/**
 * The one entry point to desktop capabilities. In Electron, window.pw is the preload bridge.
 * In a plain browser it is a web fallback with the same shape (see web-bridge.ts for what is simulated).
 * Always import this, never window.pw directly.
 */
export const pw: PwBridge = window.pw ?? createWebBridge();
