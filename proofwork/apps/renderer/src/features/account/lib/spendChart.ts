export interface SpendPoint {
  date: string;
  spent: number;
}

export interface SpendBar extends SpendPoint {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Scales values to pixel heights. The largest positive value gets the full `maxHeight`, others are
 * proportional. Zero, negative, NaN and infinite values give 0. All zeros give all zeros.
 */
export function barHeights(values: readonly number[], maxHeight: number): number[] {
  const max = values.reduce((m, v) => (Number.isFinite(v) && v > m ? v : m), 0);
  return values.map((v) => (max === 0 || !Number.isFinite(v) || v <= 0 ? 0 : (v / max) * maxHeight));
}

/** Lays out one bar per point across `width`, bottom-aligned inside `height`. */
export function layoutSpendBars(
  points: readonly SpendPoint[],
  box: { width: number; height: number; gap?: number },
): SpendBar[] {
  const n = points.length;
  if (n === 0) return [];
  const gap = box.gap ?? 4;
  const barWidth = Math.max(1, (box.width - gap * (n - 1)) / n);
  const heights = barHeights(
    points.map((p) => p.spent),
    box.height,
  );
  return points.map((p, i) => {
    const h = heights[i];
    return { date: p.date, spent: p.spent, x: i * (barWidth + gap), width: barWidth, height: h, y: box.height - h };
  });
}

const DAY_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "Nov 7" for a YYYY-MM-DD or ISO date string. Day-only strings are read as local dates. */
export function shortDayLabel(date: string): string {
  const m = DAY_ONLY.exec(date);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
