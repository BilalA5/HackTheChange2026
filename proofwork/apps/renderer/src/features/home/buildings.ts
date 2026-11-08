// Building silhouettes per Company.building. Each spec is a stack of isometric blocks plus an optional cap.
import type { Company } from "@pw/shared";

export type BuildingKind = Company["building"];

export interface BuildingBlock {
  /** Horizontal offset of the block's footprint centre from the building's ground point. */
  dx: number;
  /** Height of the ground under this block above the ground point (stacked blocks). */
  lift: number;
  /** Half width of the footprint. */
  half: number;
  height: number;
}

export type BuildingCap = "none" | "dome" | "barrel" | "spire" | "roof";

export interface BuildingSpec {
  blocks: BuildingBlock[];
  cap: BuildingCap;
}

export const BUILDING_SPECS: Record<BuildingKind, BuildingSpec> = {
  tower: {
    blocks: [
      { dx: 0, lift: 0, half: 20, height: 150 },
      { dx: 0, lift: 150, half: 13, height: 70 },
    ],
    cap: "none",
  },
  campus: {
    blocks: [
      { dx: -22, lift: 0, half: 28, height: 54 },
      { dx: 26, lift: 0, half: 24, height: 84 },
    ],
    cap: "none",
  },
  spire: {
    blocks: [
      { dx: 0, lift: 0, half: 17, height: 120 },
      { dx: 0, lift: 120, half: 10, height: 40 },
    ],
    cap: "spire",
  },
  dome: {
    blocks: [{ dx: 0, lift: 0, half: 30, height: 64 }],
    cap: "dome",
  },
  loft: {
    blocks: [
      { dx: 0, lift: 0, half: 22, height: 60 },
      { dx: 8, lift: 60, half: 14, height: 40 },
    ],
    cap: "roof",
  },
  hangar: {
    blocks: [{ dx: 0, lift: 0, half: 36, height: 40 }],
    cap: "barrel",
  },
};

/** Height in map units from the ground point to the highest point of the building, cap included. */
export function buildingHeight(kind: BuildingKind): number {
  const spec = BUILDING_SPECS[kind];
  const top = spec.blocks.reduce((max, b) => Math.max(max, b.lift + b.height), 0);
  const last = spec.blocks[spec.blocks.length - 1];
  const half = last.half;
  switch (spec.cap) {
    case "dome":
      return top + half * 0.85;
    case "barrel":
      return top + half * 0.5;
    case "roof":
      return top + half * 0.9;
    case "spire":
      return top + 60;
    default:
      return top;
  }
}
