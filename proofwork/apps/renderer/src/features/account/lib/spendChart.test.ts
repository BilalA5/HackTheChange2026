import { describe, expect, it } from "vitest";
import { barHeights, layoutSpendBars, shortDayLabel } from "./spendChart";

describe("barHeights", () => {
  it("gives the largest value the full height and scales the rest", () => {
    expect(barHeights([0, 50, 100, 25], 80)).toEqual([0, 40, 80, 20]);
  });

  it("returns zeros when every value is zero", () => {
    expect(barHeights([0, 0, 0], 80)).toEqual([0, 0, 0]);
  });

  it("clamps negative, NaN and infinite values to zero", () => {
    expect(barHeights([-5, Number.NaN, Number.POSITIVE_INFINITY, 10], 40)).toEqual([0, 0, 0, 40]);
  });

  it("returns an empty array for no values", () => {
    expect(barHeights([], 40)).toEqual([]);
  });
});

describe("layoutSpendBars", () => {
  const points = Array.from({ length: 14 }, (_, i) => ({ date: `2026-10-${String(i + 1).padStart(2, "0")}`, spent: i * 10 }));

  it("fits all bars inside the width with the gap between them", () => {
    const bars = layoutSpendBars(points, { width: 560, height: 120, gap: 6 });
    expect(bars).toHaveLength(14);
    const last = bars[bars.length - 1];
    expect(last.x + last.width).toBeCloseTo(560, 6);
    for (let i = 1; i < bars.length; i++) expect(bars[i].x).toBeGreaterThan(bars[i - 1].x);
  });

  it("bottom-aligns bars so y + height equals the box height", () => {
    const bars = layoutSpendBars(points, { width: 300, height: 120 });
    for (const b of bars) expect(b.y + b.height).toBeCloseTo(120, 6);
    expect(bars[13].height).toBe(120);
    expect(bars[0].height).toBe(0);
  });

  it("returns no bars for no points", () => {
    expect(layoutSpendBars([], { width: 300, height: 100 })).toEqual([]);
  });
});

describe("shortDayLabel", () => {
  it("formats a day-only string without a time zone shift", () => {
    expect(shortDayLabel("2026-11-07")).toBe(new Date(2026, 10, 7).toLocaleDateString("en-US", { month: "short", day: "numeric" }));
  });

  it("returns the input when it is not a date", () => {
    expect(shortDayLabel("not a date")).toBe("not a date");
  });
});
