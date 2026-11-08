// Pure geometry and colour helpers for the world map. No React, no DOM.
export interface Pt {
  x: number;
  y: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** SVG `points` attribute for a polygon. */
export function polygonPoints(points: readonly Pt[]): string {
  return points.map((p) => `${round1(p.x)},${round1(p.y)}`).join(" ");
}

/** Closed SVG path for a polygon. */
export function polygonPath(points: readonly Pt[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return `M${round1(first.x)} ${round1(first.y)}` + rest.map((p) => ` L${round1(p.x)} ${round1(p.y)}`).join("") + " Z";
}

/**
 * Isometric block sitting on a ground point. `base` is the centre of the footprint on the ground.
 * The footprint is a 2:1 diamond: `half` is the horizontal half-width, the depth is `half`.
 * Only the three visible faces are returned: left (front-left), right (front-right) and top.
 */
export interface IsoBlock {
  L: Pt;
  F: Pt;
  R: Pt;
  B: Pt;
  topL: Pt;
  topF: Pt;
  topR: Pt;
  topB: Pt;
  left: Pt[];
  right: Pt[];
  top: Pt[];
}

export function isoBlock(base: Pt, half: number, height: number): IsoBlock {
  const L = { x: base.x - half, y: base.y };
  const F = { x: base.x, y: base.y + half / 2 };
  const R = { x: base.x + half, y: base.y };
  const B = { x: base.x, y: base.y - half / 2 };
  const up = (p: Pt): Pt => ({ x: p.x, y: p.y - height });
  const topL = up(L);
  const topF = up(F);
  const topR = up(R);
  const topB = up(B);
  return {
    L,
    F,
    R,
    B,
    topL,
    topF,
    topR,
    topB,
    left: [L, F, topF, topL],
    right: [F, R, topR, topF],
    top: [topL, topF, topR, topB],
  };
}

/** Open Catmull-Rom spline through the points, as cubic Bezier path data. */
export function smoothOpenPath(points: readonly Pt[]): string {
  if (points.length < 2) return "";
  const P = points;
  let d = `M${round1(P[0].x)} ${round1(P[0].y)}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = i > 0 ? P[i - 1] : P[i];
    const p1 = P[i];
    const p2 = P[i + 1];
    const p3 = i + 2 < P.length ? P[i + 2] : p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${round1(c1x)} ${round1(c1y)} ${round1(c2x)} ${round1(c2y)} ${round1(p2.x)} ${round1(p2.y)}`;
  }
  return d;
}

/** Point on a vertical face. u runs a to b along the ground (0..1), v is height as a fraction of `height`. */
function facePoint(a: Pt, b: Pt, height: number, u: number, v: number): Pt {
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u - v * height };
}

/**
 * SVG path data for a grid of window quads on a vertical face from `a` to `b` (both on the ground).
 * One path element per face keeps the SVG element count low.
 */
export function windowPath(a: Pt, b: Pt, height: number, cols: number, rows: number): string {
  const c = Math.max(1, Math.round(cols));
  const r = Math.max(1, Math.round(rows));
  const colW = 1 / c;
  const band = 0.74 / r;
  const parts: string[] = [];
  for (let i = 0; i < c; i++) {
    for (let j = 0; j < r; j++) {
      const u0 = i * colW + colW * 0.22;
      const u1 = (i + 1) * colW - colW * 0.22;
      const v0 = 0.14 + j * band + band * 0.24;
      const v1 = 0.14 + (j + 1) * band - band * 0.24;
      parts.push(
        polygonPath([facePoint(a, b, height, u0, v0), facePoint(a, b, height, u1, v0), facePoint(a, b, height, u1, v1), facePoint(a, b, height, u0, v1)]),
      );
    }
  }
  return parts.join(" ");
}

export interface WindowSplit {
  lit: string;
  dark: string;
}

/**
 * Like windowPath, but splits the windows into a lit set and a dark set. The split is a fixed hash
 * of the window grid and `seed`, so the same building always shows the same lit windows.
 */
export function windowSplit(
  a: Pt,
  b: Pt,
  height: number,
  cols: number,
  rows: number,
  seed: number,
  litShare: number,
): WindowSplit {
  const c = Math.max(1, Math.round(cols));
  const r = Math.max(1, Math.round(rows));
  const colW = 1 / c;
  const band = 0.74 / r;
  const lit: string[] = [];
  const dark: string[] = [];
  for (let i = 0; i < c; i++) {
    for (let j = 0; j < r; j++) {
      const u0 = i * colW + colW * 0.22;
      const u1 = (i + 1) * colW - colW * 0.22;
      const v0 = 0.14 + j * band + band * 0.24;
      const v1 = 0.14 + (j + 1) * band - band * 0.24;
      const quad = polygonPath([
        facePoint(a, b, height, u0, v0),
        facePoint(a, b, height, u1, v0),
        facePoint(a, b, height, u1, v1),
        facePoint(a, b, height, u0, v1),
      ]);
      const h = (Math.imul(i + 1, 374761393) ^ Math.imul(j + 1, 668265263) ^ Math.imul(seed + 1, 2246822519)) >>> 0;
      (h % 1000 < litShare * 1000 ? lit : dark).push(quad);
    }
  }
  return { lit: lit.join(" "), dark: dark.join(" ") };
}

/** A quad on a vertical face between fractions u0..u1 and v0..v1. Used for the sign plate. */
export function facePatch(a: Pt, b: Pt, height: number, u0: number, u1: number, v0: number, v1: number): Pt[] {
  return [facePoint(a, b, height, u0, v0), facePoint(a, b, height, u1, v0), facePoint(a, b, height, u1, v1), facePoint(a, b, height, u0, v1)];
}

/** Point on a vertical face, u along the ground (0..1), v as a fraction of height. */
export function facePointAt(a: Pt, b: Pt, height: number, u: number, v: number): Pt {
  return facePoint(a, b, height, u, v);
}

// ───────────────────────────── colour ─────────────────────────────

export type Rgb = readonly [number, number, number];

/** Parses #rgb or #rrggbb. Returns null for anything else. */
export function parseHex(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h
    .split("")
    .map((ch) => ch + ch)
    .join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function toHex(rgb: Rgb): string {
  return "#" + rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/**
 * Shades a hex colour. amount < 0 mixes towards black, amount > 0 towards white (range -1..1).
 * Unparseable input is returned unchanged.
 */
export function shadeHex(hex: string, amount: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const t = Math.min(1, Math.abs(amount));
  return toHex(mix(rgb, amount < 0 ? [0, 0, 0] : [255, 255, 255], t));
}

/** Pulls a hex colour towards its luminance grey. amount 0 keeps it, 1 is fully grey. */
export function desaturateHex(hex: string, amount: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const lum = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  return toHex(mix(rgb, [lum, lum, lum], Math.min(1, Math.max(0, amount))));
}

/** The shading set for an isometric building: left face dark, right face mid, top light. */
export interface BuildingPalette {
  left: string;
  right: string;
  top: string;
  sign: string;
}

/** Mixes two hex colours. t 0 is `a`, t 1 is `b`. Unparseable input returns `a`. */
export function mixHex(a: string, b: string, t: number): string {
  const ra = parseHex(a);
  const rb = parseHex(b);
  if (!ra || !rb) return a;
  return toHex(mix(ra, rb, Math.min(1, Math.max(0, t))));
}

export function buildingPalette(color: string, muted: boolean): BuildingPalette {
  // Muted buildings keep some hue, pulled towards dusk slate rather than flat grey.
  const base = muted ? mixHex(desaturateHex(color, 0.45), "#4F5E7E", 0.25) : color;
  return {
    left: shadeHex(base, -0.32),
    right: base,
    top: shadeHex(base, 0.28),
    sign: shadeHex(base, -0.55),
  };
}
