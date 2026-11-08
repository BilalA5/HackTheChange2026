// Pure helpers for the FTUX drawing canvas. No DOM access except the CanvasRenderingContext2D type.

export interface Point {
  /** Normalised 0..1 across the canvas width. Resizing the canvas keeps the drawing in place. */
  x: number;
  /** Normalised 0..1 across the canvas height. */
  y: number;
}

export interface Stroke {
  color: string;
  /** Brush width in CSS pixels at the current canvas size. */
  width: number;
  eraser: boolean;
  points: Point[];
}

export const EXPORT_MAX_WIDTH = 800;
export const EXPORT_BACKGROUND = "#ffffff";

export const INK_SWATCHES = [
  { id: "ink", label: "Ink black", color: "#1a1b1f" },
  { id: "violet", label: "Signal violet", color: "#7b6cf6" },
  { id: "teal", label: "Deep teal", color: "#0e3b43" },
  { id: "amber", label: "Amber", color: "#f2a33a" },
  { id: "coral", label: "Coral", color: "#f0605d" },
] as const;

export const BRUSH_SIZES = { S: 2.5, M: 6, L: 12 } as const;
export type BrushSize = keyof typeof BRUSH_SIZES;

/** The eraser is this many times wider than the selected brush. */
export const ERASER_SCALE = 3;

/** Output size for the PNG export: at most EXPORT_MAX_WIDTH wide, aspect ratio kept. */
export function downscaleSize(width: number, height: number, maxWidth: number = EXPORT_MAX_WIDTH): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 };
  if (width <= maxWidth) return { width, height };
  const ratio = maxWidth / width;
  return { width: maxWidth, height: Math.max(1, Math.round(height * ratio)) };
}

/** Exponential smoothing of raw pointer input. amount 1 = no smoothing. */
export function smoothPoint(prev: Point, next: Point, amount = 0.45): Point {
  return { x: prev.x + (next.x - prev.x) * amount, y: prev.y + (next.y - prev.y) * amount };
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** True when at least one non-eraser stroke has been drawn. */
export function hasInk(strokes: readonly Stroke[]): boolean {
  return strokes.some((s) => !s.eraser && s.points.length > 0);
}

/**
 * Paints strokes with quadratic curves through the midpoints, so lines look smooth.
 * The context must already be scaled for devicePixelRatio. width and height are CSS pixels.
 */
export function paintStrokes(ctx: CanvasRenderingContext2D, strokes: readonly Stroke[], width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue;
    // Points are stored normalised (0..1); paint in canvas pixels.
    const pts = stroke.points.map((p) => ({ x: p.x * width, y: p.y * height }));
    const first = pts[0]!;
    ctx.save();
    ctx.globalCompositeOperation = stroke.eraser ? "destination-out" : "source-over";
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    if (pts.length === 1) {
      // A single point: draw a dot with round caps.
      ctx.lineTo(first.x + 0.01, first.y + 0.01);
    } else {
      for (let i = 1; i < pts.length - 1; i++) {
        const control = pts[i];
        const next = pts[i + 1];
        if (!control || !next) continue;
        const mid = midpoint(control, next);
        ctx.quadraticCurveTo(control.x, control.y, mid.x, mid.y);
      }
      const last = pts[pts.length - 1];
      if (last) ctx.lineTo(last.x, last.y);
    }
    ctx.stroke();
    ctx.restore();
  }
}
