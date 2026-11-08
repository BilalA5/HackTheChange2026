import { useCallback, useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";
import { X } from "lucide-react";
import type { NormRect } from "@pw/shared";
import { pw } from "@/lib/bridge";
import { cn } from "@/lib/cn";
import { RegionPanel } from "./RegionPanel";
import {
  MAX_REGIONS,
  addRegion,
  dragToRect,
  pixelRect,
  rectFromPoints,
  removeRegion,
  type Point,
  type PixelRect,
  type Viewport,
} from "./overlayMath";

/** Dim strength over the whole screen, from the spec: 35 percent. */
const DIM_OPACITY = 0.35;

interface DragState {
  start: Point;
  now: Point;
}

const stop = (e: ReactPointerEvent<HTMLElement>) => e.stopPropagation();

function viewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * "I'm lost" selector. Full screen and focusable. The learner drags up to five rectangles over what they
 * are stuck on, types a question and sends. Esc cancels.
 */
export default function RegionSurface() {
  const [regions, setRegions] = useState<NormRect[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [question, setQuestion] = useState("");
  const full = regions.length >= MAX_REGIONS;

  const cancel = useCallback(() => {
    pw.overlay.broadcast("region:cancel", {});
    void pw.overlay.close("region");
  }, []);

  const submit = useCallback(() => {
    const text = question.trim();
    if (text === "" && regions.length === 0) return;
    pw.overlay.broadcast("region:submit", { regions, question: text });
    void pw.overlay.close("region");
  }, [question, regions]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      cancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancel]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || full) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = { x: e.clientX, y: e.clientY };
    setDrag({ start: p, now: p });
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const now = { x: e.clientX, y: e.clientY };
    setDrag((d) => (d ? { start: d.start, now } : d));
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const rect = dragToRect(drag.start, { x: e.clientX, y: e.clientY }, viewport());
    if (rect) setRegions((prev) => addRegion(prev, rect));
    setDrag(null);
  };

  const vp = viewport();
  const preview = drag ? rectFromPoints(drag.start, drag.now) : null;
  const boxes = regions.map((r) => pixelRect(r, vp));

  return (
    <div
      className={cn("fixed inset-0 touch-none select-none", full ? "cursor-default" : "cursor-crosshair")}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDrag(null)}
    >
      <DimLayer boxes={preview ? [...boxes, preview] : boxes} />

      {boxes.map((box, i) => (
        <RegionBox key={i} index={i} box={box} onRemove={() => setRegions((prev) => removeRegion(prev, i))} />
      ))}

      <div
        onPointerDown={stop}
        className="glass absolute top-6 left-1/2 flex -translate-x-1/2 items-center gap-3 px-4 py-2.5 text-[13px] text-fg"
      >
        <span>Drag to highlight up to 5 areas you're stuck on</span>
        <kbd className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] text-fg-muted">Esc</kbd>
        <span className="text-fg-muted">to cancel</span>
      </div>

      <RegionPanel
        count={regions.length}
        max={MAX_REGIONS}
        question={question}
        onQuestionChange={setQuestion}
        onSubmit={submit}
        onCancel={cancel}
      />
    </div>
  );
}

interface DimLayerProps {
  boxes: PixelRect[];
}

/** Dims the screen, with the marked areas cut out so they show through at full brightness. */
function DimLayer({ boxes }: DimLayerProps) {
  const vp = viewport();
  return (
    <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
      <defs>
        <mask id="region-dim-mask">
          <rect x="0" y="0" width={vp.width} height={vp.height} fill="white" />
          {boxes.map((b, i) => (
            <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx="12" fill="black" />
          ))}
        </mask>
      </defs>
      <rect x="0" y="0" width={vp.width} height={vp.height} fill="black" fillOpacity={DIM_OPACITY} mask="url(#region-dim-mask)" />
    </svg>
  );
}

interface RegionBoxProps {
  index: number;
  box: PixelRect;
  onRemove(): void;
}

function RegionBox({ index, box, onRemove }: RegionBoxProps) {
  return (
    <div
      className="absolute rounded-[12px] border-2 border-accent"
      style={{ left: box.x, top: box.y, width: box.w, height: box.h, boxShadow: "0 0 24px 2px color-mix(in srgb, var(--color-accent) 40%, transparent)" }}
    >
      <span className="glass absolute -top-3 -left-3 flex size-6 items-center justify-center rounded-full font-mono text-[11px] font-semibold text-fg">
        {index + 1}
      </span>
      <button
        type="button"
        aria-label={`Remove area ${index + 1}`}
        onPointerDown={stop}
        onClick={onRemove}
        className="glass absolute -top-3 -right-3 flex size-6 items-center justify-center rounded-full text-fg hover:text-danger"
      >
        <X size={12} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}
