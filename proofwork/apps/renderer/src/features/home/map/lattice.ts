// Isometric block lattice for the world map. Pure maths, no React.
//
// A block centre is the pair (a, b) of integers with equal parity. Its screen position is
// x = a * BLOCK_STEP, y = b * BLOCK_STEP / 2. Pairs with unequal parity sit on the road lines,
// so roads are the gaps between blocks and no building can land on an intersection.
import type { Pt } from "../geometry";

export const MAP_WIDTH = 1600;
export const MAP_HEIGHT = 1000;

/** Horizontal distance between diagonal neighbour block centres. */
export const BLOCK_STEP = 131;
/** Half the width of a block top. The road between two blocks is about 28 units wide. */
export const BLOCK_HALF = 100;
/** Height of the raised sidewalk tile above the road. */
export const SIDEWALK_H = 9;

/** Buildings are packed into the left of the canvas so the glass project card never covers them. */
const CITY_X = 80;
const CITY_X_SCALE = 13.2;

export interface Cell {
  a: number;
  b: number;
}

export const cellKey = (c: Cell): string => `${c.a},${c.b}`;

/** True for block cells. Pairs with unequal parity are road lines. */
export const isBlockCell = (c: Cell): boolean => (((c.a - c.b) % 2) + 2) % 2 === 0;

export function cellCentre(c: Cell): Pt {
  return { x: c.a * BLOCK_STEP, y: (c.b * BLOCK_STEP) / 2 };
}

/** Top surface centre of a block, where a building stands. */
export function cellGround(c: Cell): Pt {
  const p = cellCentre(c);
  return { x: p.x, y: p.y - SIDEWALK_H };
}

/** scenario.map percentages to canvas units. */
export function percentToCanvas(x: number, y: number): Pt {
  return { x: CITY_X + x * CITY_X_SCALE, y: (y / 100) * MAP_HEIGHT };
}

export interface PlacedBuilding {
  cell: Cell;
  ground: Pt;
}

/** Nearest block cell to p that satisfies `accept`. Ties break on lower (a, b), so the result is deterministic. */
function snapToCell(p: Pt, accept: (c: Cell) => boolean, radius = 6): Cell | null {
  const a0 = Math.round(p.x / BLOCK_STEP);
  const b0 = Math.round((2 * p.y) / BLOCK_STEP);
  let best: Cell | null = null;
  let bestD = Infinity;
  for (let a = a0 - radius; a <= a0 + radius; a++) {
    for (let b = b0 - radius; b <= b0 + radius; b++) {
      const c = { a, b };
      if (!isBlockCell(c) || !accept(c)) continue;
      const k = cellCentre(c);
      const d = (k.x - p.x) ** 2 + (k.y - p.y) ** 2;
      if (d < bestD) {
        best = c;
        bestD = d;
      }
    }
  }
  return best;
}

/**
 * Snaps each company to the nearest free block centre, one building per block.
 * `isFree` marks land blocks that are not parks or plazas. Cards are processed in id order so the
 * result does not depend on the order the API returns them.
 */
export function layoutBuildings(
  cards: readonly { id: string; map: { x: number; y: number } }[],
  isFree: (c: Cell) => boolean,
): Map<string, PlacedBuilding> {
  const taken = new Set<string>();
  const out = new Map<string, PlacedBuilding>();
  const ordered = [...cards].sort((p, q) => (p.id < q.id ? -1 : p.id > q.id ? 1 : 0));
  for (const card of ordered) {
    const want = percentToCanvas(card.map.x, card.map.y);
    const cell =
      snapToCell(want, (c) => isFree(c) && !taken.has(cellKey(c))) ??
      snapToCell(want, (c) => !taken.has(cellKey(c)), 14);
    if (!cell) continue;
    taken.add(cellKey(cell));
    out.set(card.id, { cell, ground: cellGround(cell) });
  }
  return out;
}
