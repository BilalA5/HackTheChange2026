import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Eraser, Undo2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  BRUSH_SIZES,
  ERASER_SCALE,
  EXPORT_BACKGROUND,
  EXPORT_MAX_WIDTH,
  INK_SWATCHES,
  downscaleSize,
  hasInk,
  paintStrokes,
  smoothPoint,
  type BrushSize,
  type Point,
  type Stroke,
} from "../drawing";
import type { StepProps } from "../types";

/** Export the drawing as a PNG no wider than EXPORT_MAX_WIDTH, on a white background. */
function exportPng(source: HTMLCanvasElement): string {
  const { width, height } = downscaleSize(source.width, source.height, EXPORT_MAX_WIDTH);
  const out = document.createElement("canvas");
  out.width = Math.max(1, width);
  out.height = Math.max(1, height);
  const ctx = out.getContext("2d");
  if (!ctx) return source.toDataURL("image/png");
  ctx.fillStyle = EXPORT_BACKGROUND;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(source, 0, 0, out.width, out.height);
  return out.toDataURL("image/png");
}

const TOOL_BTN =
  "grid size-8 shrink-0 place-items-center rounded-full text-ink/70 transition-colors hover:bg-black/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:bg-black/10 aria-pressed:text-ink disabled:opacity-35";

export function DrawStep({ view, busy, send }: StepProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const strokesRef = useRef<Stroke[]>([]);
  const draftRef = useRef<Stroke | null>(null);
  const drawingRef = useRef(false);

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [eraser, setEraser] = useState(false);
  const [color, setColor] = useState<string>(INK_SWATCHES[0].color);
  const [brush, setBrush] = useState<BrushSize>("M");

  const inked = hasInk(strokes);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { w, h } = sizeRef.current;
    const all = draftRef.current ? [...strokesRef.current, draftRef.current] : strokesRef.current;
    paintStrokes(ctx, all, w, h);
  }, []);

  const commit = useCallback(
    (next: Stroke[]) => {
      strokesRef.current = next;
      setStrokes(next);
      paint();
    },
    [paint],
  );

  // Keep the backing store matched to the element, at devicePixelRatio.
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      sizeRef.current = { w, h };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [paint]);

  // Ctrl/Cmd+Z undoes the last stroke while this step is mounted.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        if (busy || strokesRef.current.length === 0) return;
        e.preventDefault();
        commit(strokesRef.current.slice(0, -1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, commit]);

  const pointFor = (e: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    const { w, h } = sizeRef.current;
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / (rect.width || w))),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / (rect.height || h))),
    };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (busy || e.button > 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const width = eraser ? BRUSH_SIZES[brush] * ERASER_SCALE : BRUSH_SIZES[brush];
    draftRef.current = { color, width, eraser, points: [pointFor(e)] };
    paint();
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const draft = draftRef.current;
    if (!drawingRef.current || !draft) return;
    const raw = pointFor(e);
    const last = draft.points[draft.points.length - 1] ?? raw;
    draft.points.push(smoothPoint(last, raw));
    paint();
  };

  const endStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const draft = draftRef.current;
    draftRef.current = null;
    if (draft && draft.points.length > 0) commit([...strokesRef.current, draft]);
    else paint();
  };

  const clear = () => commit([]);
  const undo = () => commit(strokesRef.current.slice(0, -1));

  const done = () => {
    const canvas = canvasRef.current;
    if (!canvas || !inked || busy) return;
    send({ kind: "DRAWN", dataUrl: exportPng(canvas) });
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col items-center gap-4" aria-labelledby="ftux-draw-prompt">
      <h1 id="ftux-draw-prompt" className="text-center font-serif text-[30px] leading-tight font-medium text-fg">
        {view.prompt}
      </h1>

      <div className="paper flex min-h-0 w-full max-w-[860px] flex-1 flex-col overflow-hidden">
        <div role="toolbar" aria-label="Drawing tools" className="flex flex-wrap items-center gap-2 border-b border-black/8 px-4 py-2.5 text-ink">
          <div className="flex items-center gap-1.5" role="group" aria-label="Ink colour">
            {INK_SWATCHES.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-label={s.label}
                aria-pressed={!eraser && color === s.color}
                disabled={busy}
                onClick={() => {
                  setColor(s.color);
                  setEraser(false);
                }}
                className={cn(
                  "size-6 rounded-full ring-offset-2 ring-offset-white transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40",
                  !eraser && color === s.color && "ring-2 ring-ink",
                )}
                style={{ backgroundColor: s.color }}
              />
            ))}
          </div>
          <span aria-hidden className="mx-1 h-5 w-px bg-black/10" />
          <button
            type="button"
            aria-label="Eraser"
            aria-pressed={eraser}
            disabled={busy}
            onClick={() => setEraser((v) => !v)}
            className={TOOL_BTN}
          >
            <Eraser size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <span aria-hidden className="mx-1 h-5 w-px bg-black/10" />
          <div className="flex items-center gap-1" role="group" aria-label="Brush size">
            {(Object.keys(BRUSH_SIZES) as BrushSize[]).map((s) => (
              <button
                key={s}
                type="button"
                aria-label={`Brush ${s === "S" ? "small" : s === "M" ? "medium" : "large"}`}
                aria-pressed={brush === s}
                disabled={busy}
                onClick={() => setBrush(s)}
                className={TOOL_BTN}
              >
                <span
                  aria-hidden
                  className="block rounded-full bg-current"
                  style={{ width: BRUSH_SIZES[s] + 3, height: BRUSH_SIZES[s] + 3 }}
                />
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button type="button" aria-label="Undo stroke" disabled={busy || strokes.length === 0} onClick={undo} className={TOOL_BTN}>
              <Undo2 size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Clear canvas" disabled={busy || strokes.length === 0} onClick={clear} className={TOOL_BTN}>
              <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div ref={wrapRef} className="relative min-h-[240px] flex-1 bg-paper-card">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Drawing canvas. Use the mouse or a trackpad to draw."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
            onPointerLeave={endStroke}
            className={cn("block touch-none cursor-crosshair", busy && "pointer-events-none opacity-70")}
          />
          {!inked && (
            <p aria-live="polite" className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center font-serif text-[18px] italic text-ink/45">
              Start sketching. Shapes, words and arrows all count.
            </p>
          )}
        </div>
      </div>

      <div className="flex w-full max-w-[860px] items-center justify-between gap-4">
        <Button variant="ghost" size="lg" disabled={busy} onClick={() => send({ kind: "CONTINUE" })}>
          Skip
        </Button>
        <Button variant="light" size="lg" disabled={!inked || busy} loading={busy} onClick={done} title={inked ? undefined : "Draw something first, or skip"}>
          I&apos;m done
        </Button>
      </div>
    </section>
  );
}
