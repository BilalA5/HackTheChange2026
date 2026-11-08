import { describe, expect, it } from "vitest";
import { DISTRICT } from "./district";
import { SIDEWALK_H } from "./lattice";
import { cellCentre, cellKey, isBlockCell, layoutBuildings, percentToCanvas } from "./lattice";

const cards = [
  { id: "a", map: { x: 18, y: 34 } },
  { id: "b", map: { x: 40, y: 26 } },
  { id: "c", map: { x: 58, y: 40 } },
  { id: "d", map: { x: 14, y: 60 } },
  { id: "e", map: { x: 34, y: 52 } },
  { id: "f", map: { x: 52, y: 64 } },
  { id: "g", map: { x: 30, y: 76 } },
  { id: "h", map: { x: 50, y: 80 } },
  { id: "i", map: { x: 64, y: 58 } },
];

describe("block lattice", () => {
  it("puts every building on a distinct block centre, never on a road", () => {
    const placed = layoutBuildings(cards, DISTRICT.isFree);
    const keys = new Set<string>();
    for (const card of cards) {
      const p = placed.get(card.id);
      expect(p).toBeDefined();
      expect(isBlockCell(p!.cell)).toBe(true);
      expect(p!.ground).toEqual({ x: cellCentre(p!.cell).x, y: cellCentre(p!.cell).y - SIDEWALK_H });
      keys.add(cellKey(p!.cell));
    }
    expect(keys.size).toBe(cards.length);
  });

  it("separates companies that ask for the same spot", () => {
    const same = [1, 2, 3].map((n) => ({ id: `s${n}`, map: { x: 30, y: 40 } }));
    const placed = layoutBuildings(same, DISTRICT.isFree);
    const keys = new Set([...placed.values()].map((p) => cellKey(p.cell)));
    expect(keys.size).toBe(3);
  });

  it("keeps the layout independent of card order", () => {
    const forward = layoutBuildings(cards, DISTRICT.isFree);
    const backward = layoutBuildings([...cards].reverse(), DISTRICT.isFree);
    for (const card of cards) expect(backward.get(card.id)).toEqual(forward.get(card.id));
  });

  it("never places a building on a park or plaza", () => {
    const placed = layoutBuildings(cards, DISTRICT.isFree);
    const special = new Set(DISTRICT.tiles.filter((t) => t.kind === "park" || t.kind === "plaza").map((t) => cellKey(t.cell)));
    for (const p of placed.values()) expect(special.has(cellKey(p.cell))).toBe(false);
  });

  it("maps percentages into the left of the canvas", () => {
    expect(percentToCanvas(64, 58).x).toBeLessThan(1000);
  });
});
