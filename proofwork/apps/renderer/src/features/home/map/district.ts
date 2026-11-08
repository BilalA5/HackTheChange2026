// The static district under the buildings: land blocks, parks, a plaza, roads and street lamps.
// Everything here is a pure function of the lattice and a fixed seed, so the map never reshuffles.
import { isoBlock, polygonPath, type Pt } from "../geometry";
import { BLOCK_HALF, BLOCK_STEP, SIDEWALK_H, cellCentre, cellKey, isBlockCell, type Cell } from "./lattice";
import { isLand } from "./coast";

export type TileKind = "block" | "lot" | "park" | "plaza";

export interface Tile {
  cell: Cell;
  kind: TileKind;
  centre: Pt;
}

export interface Tree {
  x: number;
  y: number;
  r: number;
}

/** Parks go near these points (canvas units). Each snaps to the nearest land block. */
const PARK_TARGETS: readonly Pt[] = [
  { x: 110, y: 340 },
  { x: 150, y: 820 },
  { x: 610, y: 930 },
];
const PLAZA_TARGET: Pt = { x: 430, y: 470 };

/** Tree spots inside a park block: [dx, dy, radius], dy measured on the block top. */
const TREE_SPOTS: readonly [number, number, number][] = [
  [-52, -6, 13],
  [-14, -14, 11],
  [20, 6, 12],
  [54, -2, 14],
  [-30, 18, 10],
];

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dist2 = (p: Pt, q: Pt) => (p.x - q.x) ** 2 + (p.y - q.y) ** 2;

function buildTiles(): Tile[] {
  const tiles: Tile[] = [];
  for (let a = -4; a <= 16; a++) {
    for (let b = -6; b <= 20; b++) {
      const c = { a, b };
      if (!isBlockCell(c)) continue;
      const centre = cellCentre(c);
      if (centre.x < -200 || centre.x > 1800 || centre.y < -200 || centre.y > 1200) continue;
      if (!isLand(centre)) continue;
      tiles.push({ cell: c, kind: "block", centre });
    }
  }

  const takeNearest = (target: Pt, kind: TileKind) => {
    let best: Tile | null = null;
    let bestD = Infinity;
    for (const t of tiles) {
      if (t.kind !== "block") continue;
      const d = dist2(t.centre, target);
      if (d < bestD) {
        best = t;
        bestD = d;
      }
    }
    if (best) best.kind = kind;
  };
  PARK_TARGETS.forEach((t) => takeNearest(t, "park"));
  takeNearest(PLAZA_TARGET, "plaza");

  // Roughly one block in five is a vacant lot: flat ground with no kerb.
  const rand = mulberry32(20260711);
  for (const t of tiles) {
    if (t.kind === "block" && rand() < 0.2) t.kind = "lot";
  }
  return tiles;
}

/**
 * Road centre lines. Family A: Y = X/2 + S*m/2. Family B: Y = S*m/2 - X/2. Both for odd m, so the
 * lines fall in the gaps between blocks. One path element holds every dash line.
 */
function roadsD(): string {
  const X0 = -1400;
  const X1 = 1800;
  const parts: string[] = [];
  const r = (n: number) => Math.round(n * 10) / 10;
  for (let m = -25; m <= 25; m += 2) {
    const y0 = (BLOCK_STEP * m) / 2;
    parts.push(`M${X0} ${r(y0 + X0 / 2)} L${X1} ${r(y0 + X1 / 2)}`);
    parts.push(`M${X0} ${r(y0 - X0 / 2)} L${X1} ${r(y0 - X1 / 2)}`);
  }
  return parts.join(" ");
}

export interface DistrictPaths {
  roads: string;
  sidesLeft: string;
  sidesRight: string;
  blockTops: string;
  lotTops: string;
  parkTops: string;
  plazaTops: string;
}

function buildPaths(tiles: readonly Tile[]): DistrictPaths {
  const out = { sidesLeft: [] as string[], sidesRight: [] as string[], blockTops: [] as string[], lotTops: [] as string[], parkTops: [] as string[], plazaTops: [] as string[] };
  for (const t of tiles) {
    if (t.kind === "lot") {
      out.lotTops.push(polygonPath(isoBlock(t.centre, BLOCK_HALF, 0).top));
      continue;
    }
    const g = isoBlock(t.centre, BLOCK_HALF, SIDEWALK_H);
    out.sidesLeft.push(polygonPath(g.left));
    out.sidesRight.push(polygonPath(g.right));
    if (t.kind === "block") out.blockTops.push(polygonPath(g.top));
    else if (t.kind === "park") out.parkTops.push(polygonPath(g.top));
    else out.plazaTops.push(polygonPath(g.top));
  }
  return {
    roads: roadsD(),
    sidesLeft: out.sidesLeft.join(" "),
    sidesRight: out.sidesRight.join(" "),
    blockTops: out.blockTops.join(" "),
    lotTops: out.lotTops.join(" "),
    parkTops: out.parkTops.join(" "),
    plazaTops: out.plazaTops.join(" "),
  };
}

function buildDistrict() {
  const tiles = buildTiles();
  const free = new Set(tiles.filter((t) => t.kind === "block" || t.kind === "lot").map((t) => cellKey(t.cell)));
  const trees: Tree[] = [];
  for (const t of tiles) {
    if (t.kind !== "park") continue;
    for (const [dx, dy, r] of TREE_SPOTS) trees.push({ x: t.centre.x + dx, y: t.centre.y - SIDEWALK_H + dy, r });
  }
  // Lamps sit on road centre lines: the midpoint between a block and its (+1, +1) neighbour.
  const lamps: Pt[] = [];
  for (const t of tiles) {
    if (lamps.length >= 14) break;
    if (t.kind !== "block" && t.kind !== "lot") continue;
    if ((t.cell.a * 3 + t.cell.b * 5) % 7 !== 0) continue;
    const p = { x: t.centre.x + BLOCK_STEP / 2, y: t.centre.y + BLOCK_STEP / 4 };
    if (p.x < 40 || p.x > 1000 || !isLand(p)) continue;
    lamps.push(p);
  }
  return {
    tiles,
    paths: buildPaths(tiles),
    trees,
    lamps,
    plaza: tiles.find((t) => t.kind === "plaza") ?? null,
    isFree: (c: Cell) => free.has(cellKey(c)),
  };
}

export const DISTRICT = buildDistrict();
