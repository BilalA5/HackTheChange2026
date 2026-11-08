import { describe, expect, it } from "vitest";
import { BUILD_STEP_MS, activeBuildingStep, buildingRoleTitle, buildingSteps } from "./building";

describe("buildingSteps", () => {
  it("names the industry in the first item", () => {
    const steps = buildingSteps("climate tech");
    expect(steps).toHaveLength(5);
    expect(steps[0]).toBe("Designing three companies around climate tech");
    expect(steps[4]).toBe("Finding jobs that fit");
  });

  it("falls back when the industry is blank", () => {
    expect(buildingSteps("   ")[0]).toBe("Designing three companies around your field");
  });
});

describe("activeBuildingStep", () => {
  it("starts at the first item and advances on the step timer", () => {
    expect(activeBuildingStep(0, 5)).toBe(0);
    expect(activeBuildingStep(BUILD_STEP_MS - 1, 5)).toBe(0);
    expect(activeBuildingStep(BUILD_STEP_MS, 5)).toBe(1);
    expect(activeBuildingStep(3 * BUILD_STEP_MS + 1, 5)).toBe(3);
  });

  it("holds on the last item while the server is still working", () => {
    expect(activeBuildingStep(10 * BUILD_STEP_MS, 5)).toBe(4);
    expect(activeBuildingStep(900_000, 5)).toBe(4);
  });

  it("handles empty lists and bad input", () => {
    expect(activeBuildingStep(5_000, 0)).toBe(-1);
    expect(activeBuildingStep(Number.NaN, 5)).toBe(0);
    expect(activeBuildingStep(-40, 5)).toBe(0);
  });
});

describe("buildingRoleTitle", () => {
  it("uses the trimmed target role or a neutral phrase", () => {
    expect(buildingRoleTitle("  Data Analyst ")).toBe("Data Analyst");
    expect(buildingRoleTitle("")).toBe("your career");
    expect(buildingRoleTitle(null)).toBe("your career");
  });
});
