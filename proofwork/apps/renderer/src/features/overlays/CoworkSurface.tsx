import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { HighlightLayer, type Highlight } from "./HighlightLayer";
import { parseHighlight } from "./overlayMessages";
import { useOverlayMessage, usePrefersReducedMotion } from "./overlayHooks";

export const HIGHLIGHT_TTL_MS = 6000;

let seq = 0;

/**
 * Highlight canvas for the co-worker. Fully transparent and click-through: it never takes the mouse.
 * A new "cowork:highlight" replaces the current one; each highlight fades out after six seconds.
 */
export default function CoworkSurface() {
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const reduced = usePrefersReducedMotion();

  useOverlayMessage("cowork:highlight", parseHighlight, (h) => {
    seq += 1;
    setHighlight({ id: seq, rect: h.rect, label: h.label });
  });

  const currentId = highlight?.id ?? null;
  useEffect(() => {
    if (currentId === null) return;
    const timer = setTimeout(() => setHighlight(null), HIGHLIGHT_TTL_MS);
    return () => clearTimeout(timer);
  }, [currentId]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <AnimatePresence>
        {highlight && <HighlightLayer key={highlight.id} highlight={highlight} reduced={reduced} />}
      </AnimatePresence>
    </div>
  );
}
