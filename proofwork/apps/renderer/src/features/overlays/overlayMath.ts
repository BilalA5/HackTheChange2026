import type { NormRect } from "@pw/shared";

/*
 * Pure geometry for the overlay surfaces. Pixel rects are CSS px in the window's own coordinate space;
 * NormRect is 0..1 of the viewport (the same convention the co-worker uses for highlights).
 */

export const MAX_REGIONS = 5;
/** A drag shorter than this on either side is a click, not a region. */
export const MIN_REGION_PX = 8;

export interface Viewport {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Clamps v into [lo, hi]. NaN collapses to lo. */
export function clamp(v: number, lo: number, hi: number): number {
  if (Number.isNaN(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
}

export function clamp01(v: number): number {
  return clamp(v, 0, 1);
}

/** Builds a non-negative rect from two corners, whatever the drag direction. */
export function rectFromPoints(a: Point, b: Point): PixelRect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(b.x - a.x),
    h: Math.abs(b.y - a.y),
  };
}

/** Normalises a pixel rect against the viewport. The rect is clipped to the viewport first. */
export function normaliseRect(rect: PixelRect, vp: Viewport): NormRect {
  if (vp.width <= 0 || vp.height <= 0) return { x: 0, y: 0, w: 0, h: 0 };
  const x0 = clamp(rect.x, 0, vp.width);
  const y0 = clamp(rect.y, 0, vp.height);
  const x1 = clamp(rect.x + rect.w, 0, vp.width);
  const y1 = clamp(rect.y + rect.h, 0, vp.height);
  return {
    x: x0 / vp.width,
    y: y0 / vp.height,
    w: (x1 - x0) / vp.width,
    h: (y1 - y0) / vp.height,
  };
}

/** Inverse of normaliseRect: a normalised rect back to viewport pixels. Inputs are clamped to 0..1. */
export function pixelRect(norm: NormRect, vp: Viewport): PixelRect {
  return {
    x: clamp01(norm.x) * vp.width,
    y: clamp01(norm.y) * vp.height,
    w: clamp01(norm.w) * vp.width,
    h: clamp01(norm.h) * vp.height,
  };
}

export function rectCenter(rect: PixelRect): Point {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

/**
 * Drag-to-rect: the rect a drag from `start` to `end` covers, normalised to the viewport.
 * Returns null when the drag is too small to count as a region (a stray click).
 */
export function dragToRect(start: Point, end: Point, vp: Viewport): NormRect | null {
  const px = rectFromPoints(start, end);
  if (px.w < MIN_REGION_PX || px.h < MIN_REGION_PX) return null;
  return normaliseRect(px, vp);
}

/** Appends a region unless the list is already full. Never mutates the input. */
export function addRegion(list: readonly NormRect[], rect: NormRect, max: number = MAX_REGIONS): NormRect[] {
  return list.length >= max ? [...list] : [...list, rect];
}

export function removeRegion(list: readonly NormRect[], index: number): NormRect[] {
  return list.filter((_, i) => i !== index);
}

/**
 * Keyframes for a cursor that flies from `from` to `to` along a shallow arc (the "motion path").
 * The arc peaks `lift` px above the straight line's midpoint, never above the top edge.
 */
export function arcPath(from: Point, to: Point, lift = 90): { x: number[]; y: number[] } {
  const midY = Math.max(0, (from.y + to.y) / 2 - lift);
  return {
    x: [from.x, (from.x + to.x) / 2, to.x],
    y: [from.y, midY, to.y],
  };
}
