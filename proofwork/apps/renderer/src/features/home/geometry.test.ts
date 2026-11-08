import { describe, expect, it } from "vitest";
import { desaturateHex, isoBlock, parseHex, polygonPath, shadeHex, windowPath } from "./geometry";

describe("isoBlock", () => {
  it("builds a 2:1 diamond footprint and lifts the top by the block height", () => {
    const b = isoBlock({ x: 300, y: 400 }, 20, 100);
    expect(b.L).toEqual({ x: 280, y: 400 });
    expect(b.R).toEqual({ x: 320, y: 400 });
    expect(b.F).toEqual({ x: 300, y: 410 });
    expect(b.B).toEqual({ x: 300, y: 390 });
    expect(b.topL).toEqual({ x: 280, y: 300 });
    expect(b.topB).toEqual({ x: 300, y: 290 });
    expect(b.left).toHaveLength(4);
    expect(b.right).toHaveLength(4);
    expect(b.top).toHaveLength(4);
  });
});

describe("windowPath", () => {
  it("emits one quad per window", () => {
    const d = windowPath({ x: 0, y: 0 }, { x: 10, y: 5 }, 80, 3, 4);
    expect(d.match(/M/g)).toHaveLength(12);
  });

  it("clamps zero columns and rows to one quad", () => {
    expect(windowPath({ x: 0, y: 0 }, { x: 10, y: 5 }, 80, 0, 0).match(/M/g)).toHaveLength(1);
  });
});

describe("polygonPath", () => {
  it("closes the polygon", () => {
    expect(polygonPath([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }])).toBe("M0 0 L4 0 L4 4 Z");
    expect(polygonPath([])).toBe("");
  });
});

describe("colour helpers", () => {
  it("parses short and long hex", () => {
    expect(parseHex("#abc")).toEqual([170, 187, 204]);
    expect(parseHex("#0E3B43")).toEqual([14, 59, 67]);
    expect(parseHex("teal")).toBeNull();
  });

  it("shades towards black and white", () => {
    expect(shadeHex("#000000", 0.5)).toBe("#808080");
    expect(shadeHex("#ffffff", -1)).toBe("#000000");
    expect(shadeHex("#ffffff", 0)).toBe("#ffffff");
    expect(shadeHex("not-a-colour", -0.5)).toBe("not-a-colour");
  });

  it("desaturates to a neutral grey at full strength", () => {
    const g = desaturateHex("#ff0000", 1);
    expect(g.slice(1, 3)).toBe(g.slice(3, 5));
    expect(g.slice(3, 5)).toBe(g.slice(5, 7));
    expect(desaturateHex("#ff0000", 0)).toBe("#ff0000");
  });
});
