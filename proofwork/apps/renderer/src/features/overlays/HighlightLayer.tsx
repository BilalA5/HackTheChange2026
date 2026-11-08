import { useState, useId } from "react";
import { motion } from "motion/react";
import type { NormRect } from "@pw/shared";
import { arcPath, pixelRect, rectCenter, type Viewport } from "./overlayMath";
import { CoworkCursor } from "./CoworkCursor";

export interface Highlight {
  id: number;
  rect: NormRect;
  label: string;
}

export interface HighlightLayerProps {
  highlight: Highlight;
  reduced: boolean;
}

/** Where the island sits: top centre. The cursor starts here and flies to the highlight. */
const ISLAND_ANCHOR = { y: 28 } as const;
const FLIGHT_MS = 900;
const LABEL_GAP = 8;

/** One highlight: a dim with a cut-out, a glowing outline, a label and the flying cursor. */
export function HighlightLayer({ highlight, reduced }: HighlightLayerProps) {
  const [clicked, setClicked] = useState(false);
  const maskId = `cw-mask-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const vp: Viewport = { width: window.innerWidth, height: window.innerHeight };
  const box = pixelRect(highlight.rect, vp);
  const center = rectCenter(box);
  const labelBelow = box.y < 48;
  const path = arcPath({ x: vp.width / 2, y: ISLAND_ANCHOR.y }, center);
  const fade = reduced ? 0 : 0.25;

  return (
    <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: fade }}>
      <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width={vp.width} height={vp.height} fill="white" />
            <rect x={box.x} y={box.y} width={box.w} height={box.h} rx="14" fill="black" />
          </mask>
        </defs>
        <rect x="0" y="0" width={vp.width} height={vp.height} fill="black" fillOpacity={0.4} mask={`url(#${maskId})`} />
      </svg>

      <motion.div
        className="absolute rounded-[14px] border-2 border-accent"
        style={{
          left: box.x,
          top: box.y,
          width: box.w,
          height: box.h,
          boxShadow: "0 0 0 4px color-mix(in srgb, var(--color-accent) 22%, transparent), 0 0 34px 6px color-mix(in srgb, var(--color-accent) 50%, transparent)",
        }}
        initial={{ opacity: 0, scale: reduced ? 1 : 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: fade }}
      />

      <div
        className="glass absolute max-w-[360px] px-3 py-1.5 font-mono text-[12px] tracking-[0.04em] text-fg"
        style={{ left: box.x, top: labelBelow ? box.y + box.h + LABEL_GAP : box.y - LABEL_GAP, transform: labelBelow ? undefined : "translateY(-100%)" }}
      >
        {highlight.label}
      </div>

      <CoworkCursor path={path} duration={reduced ? 0 : FLIGHT_MS / 1000} onArrive={() => setClicked(true)} />

      {clicked && !reduced && (
        <motion.span
          className="absolute rounded-full border-2 border-accent"
          style={{ left: center.x - 20, top: center.y - 20, width: 40, height: 40 }}
          initial={{ scale: 0.4, opacity: 0.9 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      )}
    </motion.div>
  );
}
