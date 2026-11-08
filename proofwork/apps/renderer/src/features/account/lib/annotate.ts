/** A rectangle in image space, every value 0..1 of the image width or height. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Rectangle spanned by two corner points, normalised and clamped to the image. */
export function normalizeRect(a: Point, b: Point): Rect {
  const x1 = clamp01(Math.min(a.x, b.x));
  const y1 = clamp01(Math.min(a.y, b.y));
  const x2 = clamp01(Math.max(a.x, b.x));
  const y2 = clamp01(Math.max(a.y, b.y));
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

/** Smallest highlight worth keeping. Smaller drags are treated as a stray click. */
export const MIN_RECT_SIDE = 0.01;

/** Strokes each rect onto a `width` x `height` pixel context. */
export function paintRects(ctx: CanvasRenderingContext2D, width: number, height: number, rects: readonly Rect[], color: string): void {
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = Math.max(2, Math.round(width / 400));
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  for (const r of rects) {
    ctx.globalAlpha = 0.14;
    ctx.fillRect(r.x * width, r.y * height, r.w * width, r.h * height);
    ctx.globalAlpha = 1;
    ctx.strokeRect(r.x * width, r.y * height, r.w * width, r.h * height);
  }
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("The screenshot could not be read."));
    img.src = src;
  });
}

/** Flattens the screenshot and its highlights into one PNG data URL at the screenshot's native size. */
export async function composeScreenshot(dataUrl: string, rects: readonly Rect[], color: string): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this window.");
  ctx.drawImage(img, 0, 0);
  paintRects(ctx, canvas.width, canvas.height, rects, color);
  return canvas.toDataURL("image/png");
}

/** Reads a File as a data URL. */
export function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The file could not be read."));
    reader.readAsDataURL(file);
  });
}
