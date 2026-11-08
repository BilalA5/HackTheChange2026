import { describe, expect, it } from "vitest";
import { BOARD_FIELDS, boardFilledCount, boardRows, boardText } from "./board";

describe("vision board fields", () => {
  it("shows six fields, including Level", () => {
    expect(BOARD_FIELDS).toHaveLength(6);
    expect(BOARD_FIELDS.map((f) => f.key)).toContain("level");
  });

  it("counts Level as filled when the server sends it", () => {
    const board = { targetRole: "Data Analyst", level: "Junior", industry: "Health", companyType: "Startup", location: "Oslo", timeline: "3 months" };
    expect(boardFilledCount(board)).toBe(6);
    expect(boardRows(board).find((r) => r.key === "level")?.value).toBe("Junior");
  });

  it("ignores blank and missing values", () => {
    expect(boardFilledCount({ targetRole: "  ", level: "" })).toBe(0);
    expect(boardFilledCount({})).toBe(0);
  });

  it("normalises scalars and drops objects", () => {
    expect(boardText(0)).toBe("0");
    expect(boardText(null)).toBe("");
    expect(boardText({ a: 1 })).toBe("");
    expect(boardText(" Mid ")).toBe("Mid");
  });
});
