import { describe, expect, it } from "vitest";
import { downscaleSize, hasInk, midpoint, paintStrokes, smoothPoint, type Stroke } from "./drawing";

const stroke = (over: Partial<Stroke> = {}): Stroke => ({
  color: "#000000",
  width: 4,
  eraser: false,
  points: [{ x: 0.1, y: 0.1 }, { x: 0.5, y: 0.5 }],
  ...over,
});

describe("downscaleSize", () => {
  it("scales wide images down to 800px keeping the aspect ratio", () => {
    expect(downscaleSize(2200, 1000)).toEqual({ width: 800, height: 364 });
  });

  it("leaves images at or under the limit untouched", () => {
    expect(downscaleSize(600, 400)).toEqual({ width: 600, height: 400 });
    expect(downscaleSize(800, 500)).toEqual({ width: 800, height: 500 });
  });

  it("returns zero for empty input", () => {
    expect(downscaleSize(0, 300)).toEqual({ width: 0, height: 0 });
  });
});

describe("smoothing", () => {
  it("moves part of the way from the previous point to the raw point", () => {
    expect(smoothPoint({ x: 0, y: 0 }, { x: 1, y: 1 }, 0.5)).toEqual({ x: 0.5, y: 0.5 });
  });

  it("finds midpoints", () => {
    expect(midpoint({ x: 0, y: 0 }, { x: 0.2, y: 0.4 })).toEqual({ x: 0.1, y: 0.2 });
  });
});

describe("hasInk", () => {
  it("is false for an empty canvas or only erased strokes", () => {
    expect(hasInk([])).toBe(false);
    expect(hasInk([stroke({ eraser: true })])).toBe(false);
  });

  it("is true once a real stroke has points", () => {
    expect(hasInk([stroke()])).toBe(true);
    expect(hasInk([stroke({ points: [] })])).toBe(false);
  });
});

describe("paintStrokes", () => {
  it("clears, then strokes each stroke with round caps, skipping empty strokes", () => {
    const calls: string[] = [];
    const ctx = {
      save: () => calls.push("save"),
      restore: () => calls.push("restore"),
      clearRect: () => calls.push("clear"),
      beginPath: () => calls.push("begin"),
      moveTo: () => calls.push("move"),
      lineTo: () => calls.push("line"),
      quadraticCurveTo: () => calls.push("quad"),
      stroke: () => calls.push("stroke"),
      globalCompositeOperation: "source-over",
      strokeStyle: "",
      lineWidth: 0,
      lineCap: "butt",
      lineJoin: "miter",
    } as unknown as CanvasRenderingContext2D;

    paintStrokes(ctx, [stroke(), stroke({ points: [] }), stroke({ eraser: true, points: [{ x: 0, y: 0 }, { x: 0.2, y: 0.2 }, { x: 0.4, y: 0.4 }] })], 100, 100);

    expect(calls[0]).toBe("clear");
    expect(calls.filter((c) => c === "stroke")).toHaveLength(2);
    expect(calls.filter((c) => c === "quad")).toHaveLength(1);
  });
});
