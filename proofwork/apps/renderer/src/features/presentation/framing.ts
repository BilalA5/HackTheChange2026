/*
 * Lighting and framing check. Pure helpers only (no DOM), so they can be unit tested on synthetic pixels.
 *
 * This is a crude lighting check plus a "someone is there" hint. It is NOT face detection.
 * The camera is sampled at 64x36 every 500 ms; luminance comes from Rec.709 weights.
 */
import type { FramingReason } from "./types";

export type { FramingReason } from "./types";

export const SAMPLE_WIDTH = 64;
export const SAMPLE_HEIGHT = 36;
export const SAMPLE_INTERVAL_MS = 500;

/** Mean luminance band that counts as well lit (0..1). */
export const LUMA_MIN = 0.25;
export const LUMA_MAX = 0.85;
/** Below this mean the frame is treated as a black or covered lens. */
export const BLACK_MEAN = 0.03;
/** Below this overall variance the frame is treated as frozen or blank. */
export const FLAT_VARIANCE = 1e-6;
/** Centre-weight ratio above which the guide area is considered to hold a person. */
export const PRESENCE_RATIO = 1.5;

/** Framing guide: ellipse centred at (0.5, 0.42) in normalised frame coordinates. */
export const GUIDE_ELLIPSE = { cx: 0.5, cy: 0.42, rx: 0.3, ry: 0.42 } as const;

export interface FrameStats {
  mean: number;
  variance: number;
  insideVariance: number;
  outsideVariance: number;
  insideCount: number;
  outsideCount: number;
}

/** Rec.709 luminance of an 8-bit RGB pixel, normalised to 0..1. */
export function luminance(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Whether a normalised point (0..1 on both axes) lies inside the framing guide ellipse. */
export function insideGuide(nx: number, ny: number): boolean {
  const dx = (nx - GUIDE_ELLIPSE.cx) / GUIDE_ELLIPSE.rx;
  const dy = (ny - GUIDE_ELLIPSE.cy) / GUIDE_ELLIPSE.ry;
  return dx * dx + dy * dy <= 1;
}

function variance(sum: number, sumSq: number, n: number): number {
  if (n === 0) return 0;
  const mean = sum / n;
  return Math.max(0, sumSq / n - mean * mean);
}

/**
 * Computes luminance statistics for an RGBA buffer (ImageData.data layout, 4 bytes per pixel).
 * Pixels are split into inside and outside the framing guide ellipse.
 */
export function analyzeFrame(rgba: ArrayLike<number>, width: number, height: number): FrameStats {
  const total = width * height;
  if (total === 0 || rgba.length < total * 4) {
    throw new RangeError(`analyzeFrame: need ${total * 4} bytes for ${width}x${height}, got ${rgba.length}`);
  }
  let sum = 0;
  let sumSq = 0;
  let inSum = 0;
  let inSumSq = 0;
  let inCount = 0;
  let outSum = 0;
  let outSumSq = 0;
  let outCount = 0;

  for (let y = 0; y < height; y++) {
    const ny = (y + 0.5) / height;
    for (let x = 0; x < width; x++) {
      const nx = (x + 0.5) / width;
      const i = (y * width + x) * 4;
      const l = luminance(rgba[i], rgba[i + 1], rgba[i + 2]);
      sum += l;
      sumSq += l * l;
      if (insideGuide(nx, ny)) {
        inSum += l;
        inSumSq += l * l;
        inCount++;
      } else {
        outSum += l;
        outSumSq += l * l;
        outCount++;
      }
    }
  }

  return {
    mean: sum / total,
    variance: variance(sum, sumSq, total),
    insideVariance: variance(inSum, inSumSq, inCount),
    outsideVariance: variance(outSum, outSumSq, outCount),
    insideCount: inCount,
    outsideCount: outCount,
  };
}

/**
 * Centre-weight ratio: luminance variance inside the guide over variance outside it.
 * A person in the guide on a plain background gives a high ratio. An empty room gives about 1.
 */
export function centreRatio(stats: FrameStats): number {
  return stats.insideVariance / (stats.outsideVariance + 1e-4);
}

/** Maps frame statistics to a reason code. "no_signal" covers black and frozen frames. */
export function classifyFrame(stats: FrameStats): FramingReason {
  if (stats.mean < BLACK_MEAN || stats.variance < FLAT_VARIANCE) return "no_signal";
  if (stats.mean < LUMA_MIN) return "too_dark";
  if (stats.mean > LUMA_MAX) return "too_bright";
  return "ok";
}

/** Fraction of samples that were "ok". 0 when there are no samples. */
export function framingScore(reasons: readonly FramingReason[]): number {
  if (reasons.length === 0) return 0;
  const ok = reasons.reduce((n, r) => (r === "ok" ? n + 1 : n), 0);
  return ok / reasons.length;
}

/** Short tip text for the current verdict. Honest copy: this is a lighting check, not face detection. */
export function tipFor(reason: FramingReason | null, ratio: number | null): string {
  switch (reason) {
    case null:
      return "Waiting for the camera.";
    case "too_dark":
      return "Too dark. Face a window or turn on a lamp.";
    case "too_bright":
      return "Too bright. Move away from the window or lower the light behind you.";
    case "no_signal":
      return "No picture from the camera. Check the selected device.";
    case "ok":
      return ratio !== null && ratio < PRESENCE_RATIO
        ? "Lighting is fine. Step into the guide so you sit in the centre."
        : "Lighting and framing look good.";
  }
}

/** Ring colour token name for a verdict (used by the camera bubble and the setup card). */
export function ringToneFor(reason: FramingReason | null): "success" | "warning" | "danger" | "neutral" {
  switch (reason) {
    case "ok":
      return "success";
    case "too_dark":
    case "too_bright":
      return "warning";
    case "no_signal":
      return "danger";
    case null:
      return "neutral";
  }
}

export const MIME_CANDIDATES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4",
] as const;

/**
 * First supported recorder mimeType from the fallback chain, or null when none is supported
 * (MediaRecorder then picks its own default). `supports` is usually MediaRecorder.isTypeSupported.
 */
export function pickMimeType(supports: (type: string) => boolean): string | null {
  for (const candidate of MIME_CANDIDATES) {
    if (supports(candidate)) return candidate;
  }
  return null;
}
