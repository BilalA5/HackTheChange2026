import { motion } from "motion/react";

export interface CoworkCursorProps {
  /** Keyframes from arcPath(): the first point is the start, the last is the target. */
  path: { x: number[]; y: number[] };
  duration: number;
  onArrive(): void;
}

/** The co-worker's pointer. Flies along the arc, then reports arrival so the click pulse can play. */
export function CoworkCursor({ path, duration, onArrive }: CoworkCursorProps) {
  return (
    <motion.div
      className="absolute top-0 left-0 size-6"
      initial={{ x: path.x[0], y: path.y[0], opacity: 0 }}
      animate={{ x: path.x, y: path.y, opacity: 1 }}
      transition={{ duration, times: [0, 0.5, 1], ease: "easeInOut" }}
      onAnimationComplete={() => onArrive()}
    >
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">
        <path d="M2 2 L2 18 L7 13.5 L10.2 20.4 L13.2 19.1 L10 12.4 L17 12.4 Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" style={{ fill: "var(--color-accent)" }} />
      </svg>
    </motion.div>
  );
}
