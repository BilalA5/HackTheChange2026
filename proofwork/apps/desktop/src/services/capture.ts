// Screen capture, change detection, focused app and media permissions.
import { desktopCapturer, screen, shell, systemPreferences, type NativeImage } from "electron";
import { execFile } from "node:child_process";
import type { PermissionKind, PermissionStatus, ScreenshotResult } from "@pw/shared";
import { log, errorMessage } from "../log.ts";

const DIFF_W = 64;
const DIFF_H = 36;
const PIXEL_DELTA = 24;
const CHANGED_RATIO = 0.02;

const SETTINGS_URLS: Record<PermissionKind, string> = {
  screen: "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture",
  microphone: "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone",
  camera: "x-apple.systempreferences:com.apple.preference.security?Privacy_Camera",
  speech: "x-apple.systempreferences:com.apple.preference.security?Privacy_SpeechRecognition",
};

export interface CaptureDeps {
  speechPermission(): Promise<PermissionStatus>;
}

export class CaptureService {
  private previous: Uint8Array | null = null;

  constructor(private readonly deps: CaptureDeps) {}

  async screenshot(maxWidth = 1280): Promise<ScreenshotResult> {
    const display = screen.getPrimaryDisplay();
    const aspect = display.size.width / display.size.height;
    const width = Math.max(64, Math.min(maxWidth, Math.round(display.size.width * display.scaleFactor)));
    const height = Math.max(36, Math.round(width / aspect));

    const sources = await desktopCapturer.getSources({ types: ["screen"], thumbnailSize: { width, height } });
    const source = sources.find((s) => s.display_id === String(display.id)) ?? sources[0];
    if (!source) throw new Error("no screen source is available (check Screen Recording permission)");

    const image = source.thumbnail;
    if (image.isEmpty()) throw new Error("screen capture is empty (check Screen Recording permission)");

    const jpeg = image.toJPEG(70);
    const { changed, diff } = this.compare(image);
    const size = image.getSize();
    const focusedApp = await focusedAppName();

    return {
      dataUrl: `data:image/jpeg;base64,${jpeg.toString("base64")}`,
      width: size.width,
      height: size.height,
      changed,
      diff,
      focusedApp,
    };
  }

  /** Grayscale 64×36 comparison against the previous capture. The first capture always counts as changed. */
  private compare(image: NativeImage): { changed: boolean; diff: number } {
    const small = image.resize({ width: DIFF_W, height: DIFF_H }).toBitmap(); // BGRA
    const gray = new Uint8Array(DIFF_W * DIFF_H);
    for (let i = 0, p = 0; p < gray.length; i += 4, p++) {
      const b = small[i];
      const g = small[i + 1];
      const r = small[i + 2];
      gray[p] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    }
    const previous = this.previous;
    this.previous = gray;
    if (!previous) return { changed: true, diff: 1 };
    let changedPixels = 0;
    for (let p = 0; p < gray.length; p++) {
      if (Math.abs(gray[p] - previous[p]) > PIXEL_DELTA) changedPixels++;
    }
    const diff = changedPixels / gray.length;
    return { changed: diff > CHANGED_RATIO, diff };
  }

  async permission(kind: PermissionKind): Promise<PermissionStatus> {
    if (kind === "speech") return this.deps.speechPermission();
    return systemPreferences.getMediaAccessStatus(kind);
  }

  async requestPermission(kind: PermissionKind): Promise<PermissionStatus> {
    if (kind === "microphone" || kind === "camera") {
      await systemPreferences.askForMediaAccess(kind).catch((err: unknown) => {
        log.warn(`media access request failed: ${errorMessage(err)}`);
        return false;
      });
    } else if (kind === "screen") {
      // Attempting a capture is what makes macOS list the app under Screen Recording.
      await desktopCapturer.getSources({ types: ["screen"], thumbnailSize: { width: 1, height: 1 } }).catch(() => []);
    }
    return this.permission(kind);
  }

  async openPermissionSettings(kind: PermissionKind): Promise<void> {
    await shell.openExternal(SETTINGS_URLS[kind]);
  }
}

/** Best-effort app name of the frontmost window (mac only). Errors and slow lookups yield undefined. */
export function focusedAppName(): Promise<string | undefined> {
  if (process.platform !== "darwin") return Promise.resolve(undefined);
  return new Promise((resolve) => {
    execFile(
      "/bin/sh",
      ["-c", 'lsappinfo info -only name "$(lsappinfo front)"'],
      { timeout: 800 },
      (err, stdout) => {
        if (err) return resolve(undefined);
        const match = /="([^"]+)"/.exec(String(stdout));
        resolve(match?.[1]);
      },
    );
  });
}

