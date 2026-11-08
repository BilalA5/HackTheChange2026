import { describe, expect, it } from "vitest";
import {
  MAX_REGIONS,
  addRegion,
  arcPath,
  clamp,
  clamp01,
  dragToRect,
  normaliseRect,
  pixelRect,
  rectCenter,
  rectFromPoints,
  removeRegion,
} from "./overlayMath";

const VP = { width: 1000, height: 500 };

describe("clamp", () => {
  it("keeps values inside the range and collapses NaN to the lower bound", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
    expect(clamp(Number.NaN, 2, 10)).toBe(2);
    expect(clamp01(1.7)).toBe(1);
  });
});

describe("rectFromPoints", () => {
  it("builds a non-negative rect whatever the drag direction", () => {
    expect(rectFromPoints({ x: 10, y: 20 }, { x: 110, y: 70 })).toEqual({ x: 10, y: 20, w: 100, h: 50 });
    expect(rectFromPoints({ x: 110, y: 70 }, { x: 10, y: 20 })).toEqual({ x: 10, y: 20, w: 100, h: 50 });
  });
});

describe("normaliseRect", () => {
  it("maps pixels to 0..1 of the viewport", () => {
    expect(normaliseRect({ x: 250, y: 100, w: 500, h: 250 }, VP)).toEqual({ x: 0.25, y: 0.2, w: 0.5, h: 0.5 });
  });

  it("clips a rect that runs off the viewport", () => {
    expect(normaliseRect({ x: -100, y: 400, w: 300, h: 300 }, VP)).toEqual({ x: 0, y: 0.8, w: 0.2, h: 0.2 });
  });

  it("returns an empty rect for a degenerate viewport", () => {
    expect(normaliseRect({ x: 1, y: 1, w: 5, h: 5 }, { width: 0, height: 500 })).toEqual({ x: 0, y: 0, w: 0, h: 0 });
  });

  it("round-trips through pixelRect", () => {
    const px = pixelRect({ x: 0.1, y: 0.2, w: 0.3, h: 0.4 }, VP);
    const back = normaliseRect(px, VP);
    expect(back.x).toBeCloseTo(0.1);
    expect(back.y).toBeCloseTo(0.2);
    expect(back.w).toBeCloseTo(0.3);
    expect(back.h).toBeCloseTo(0.4);
  });

  it("clamps out-of-range normalised input when converting to pixels", () => {
    expect(pixelRect({ x: -1, y: 2, w: 0.5, h: 0.5 }, VP)).toEqual({ x: 0, y: 500, w: 500, h: 250 });
  });
});

describe("dragToRect", () => {
  it("turns a drag into a normalised region", () => {
    expect(dragToRect({ x: 500, y: 250 }, { x: 0, y: 0 }, VP)).toEqual({ x: 0, y: 0, w: 0.5, h: 0.5 });
  });

  it("ignores drags too small to be a region", () => {
    expect(dragToRect({ x: 10, y: 10 }, { x: 14, y: 40 }, VP)).toBeNull();
    expect(dragToRect({ x: 10, y: 10 }, { x: 40, y: 12 }, VP)).toBeNull();
  });
});

describe("addRegion and removeRegion", () => {
  const r = { x: 0, y: 0, w: 0.1, h: 0.1 };

  it("caps the list at five regions and never mutates its input", () => {
    let list: ReturnType<typeof addRegion> = [];
    for (let i = 0; i < MAX_REGIONS + 3; i += 1) list = addRegion(list, r);
    expect(list).toHaveLength(MAX_REGIONS);
    const before = [r];
    const after = addRegion(before, r);
    expect(before).toHaveLength(1);
    expect(after).toHaveLength(2);
  });

  it("removes by index", () => {
    const list = [
      { x: 0.1, y: 0, w: 0.1, h: 0.1 },
      { x: 0.2, y: 0, w: 0.1, h: 0.1 },
      { x: 0.3, y: 0, w: 0.1, h: 0.1 },
    ];
    expect(removeRegion(list, 1).map((x) => x.x)).toEqual([0.1, 0.3]);
  });
});

describe("arcPath and rectCenter", () => {
  it("starts at the origin, ends on the target and lifts the midpoint", () => {
    const path = arcPath({ x: 500, y: 28 }, { x: 200, y: 300 }, 90);
    expect(path.x).toEqual([500, 350, 200]);
    expect(path.y[0]).toBe(28);
    expect(path.y[2]).toBe(300);
    expect(path.y[1]).toBe(Math.max(0, (28 + 300) / 2 - 90));
  });

  it("never lifts the midpoint above the top edge", () => {
    expect(arcPath({ x: 0, y: 0 }, { x: 0, y: 10 }, 500).y[1]).toBe(0);
  });

  it("finds the centre of a pixel rect", () => {
    expect(rectCenter({ x: 10, y: 20, w: 100, h: 40 })).toEqual({ x: 60, y: 40 });
  });
});
