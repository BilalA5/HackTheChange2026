// Shoreline for the world map: sea along the top and right, land below and to the left.
// Pure geometry. The land mask in MapBackdrop is built from these paths.
import { smoothOpenPath, type Pt } from "../geometry";

/** Land-side shoreline: from the left edge, along the top, down the right, to the bottom edge. */
export const COAST: readonly Pt[] = [
  { x: -30, y: 62 },
  { x: 150, y: 80 },
  { x: 290, y: 104 },
  { x: 420, y: 78 },
  { x: 560, y: 96 },
  { x: 700, y: 124 },
  { x: 830, y: 108 },
  { x: 960, y: 128 },
  { x: 1080, y: 112 },
  { x: 1200, y: 134 },
  { x: 1320, y: 160 },
  { x: 1400, y: 240 },
  { x: 1366, y: 380 },
  { x: 1430, y: 520 },
  { x: 1388, y: 680 },
  { x: 1452, y: 840 },
  { x: 1420, y: 1040 },
];

/** Width of the sand strip, centred on the shoreline. */
export const COAST_BAND = 44;

export const COAST_PATH = smoothOpenPath(COAST);

/** Sea region: the shoreline closed through the top-right corner. */
export const SEA_PATH = `${COAST_PATH} L1640 1040 L1640 -40 L-40 -40 Z`;

const LAND_POLY: readonly Pt[] = [...COAST, { x: -40, y: 1040 }];

/** Even-odd point in polygon test against the land polygon (polyline version of the shoreline). */
export function isLand(p: Pt): boolean {
  let inside = false;
  for (let i = 0, j = LAND_POLY.length - 1; i < LAND_POLY.length; j = i++) {
    const a = LAND_POLY[i];
    const b = LAND_POLY[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
