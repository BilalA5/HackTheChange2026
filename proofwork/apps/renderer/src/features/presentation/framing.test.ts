import { describe, expect, it } from "vitest";
import {
  SAMPLE_HEIGHT,
  SAMPLE_WIDTH,
  analyzeFrame,
  centreRatio,
  classifyFrame,
  framingScore,
  insideGuide,
  luminance,
  pickMimeType,
  tipFor,
} from "./framing";

/** Builds an RGBA buffer where every pixel is `fill(x, y)` as a grey level 0..255. */
function frame(fill: (x: number, y: number) => number, w = SAMPLE_WIDTH, h = SAMPLE_HEIGHT): Uint8ClampedArray {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = fill(x, y);
      const i = (y * w + x) * 4;
      out[i] = v;
      out[i + 1] = v;
      out[i + 2] = v;
      out[i + 3] = 255;
    }
  }
  return out;
}

const uniform = (v: number) => frame(() => v);

describe("luminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(luminance(0, 0, 0)).toBe(0);
    expect(luminance(255, 255, 255)).toBeCloseTo(1, 6);
  });

  it("weights green most heavily", () => {
    expect(luminance(0, 255, 0)).toBeGreaterThan(luminance(255, 0, 0));
    expect(luminance(255, 0, 0)).toBeGreaterThan(luminance(0, 0, 255));
  });
});

describe("insideGuide", () => {
  it("contains the guide centre and excludes corners", () => {
    expect(insideGuide(0.5, 0.42)).toBe(true);
    expect(insideGuide(0.05, 0.05)).toBe(false);
    expect(insideGuide(0.95, 0.95)).toBe(false);
  });
});

describe("classifyFrame", () => {
  it("reports ok for a mid-grey frame with some texture", () => {
    const stats = analyzeFrame(frame((x, y) => (x + y) % 2 === 0 ? 110 : 150), SAMPLE_WIDTH, SAMPLE_HEIGHT);
    expect(classifyFrame(stats)).toBe("ok");
  });

  it("reports too_dark below 0.25 mean luminance", () => {
    const stats = analyzeFrame(frame((x, y) => (x + y) % 2 === 0 ? 40 : 60), SAMPLE_WIDTH, SAMPLE_HEIGHT);
    expect(stats.mean).toBeLessThan(0.25);
    expect(classifyFrame(stats)).toBe("too_dark");
  });

  it("reports too_bright above 0.85 mean luminance", () => {
    const stats = analyzeFrame(frame((x, y) => (x + y) % 2 === 0 ? 230 : 250), SAMPLE_WIDTH, SAMPLE_HEIGHT);
    expect(stats.mean).toBeGreaterThan(0.85);
    expect(classifyFrame(stats)).toBe("too_bright");
  });

  it("reports no_signal for a black frame", () => {
    expect(classifyFrame(analyzeFrame(uniform(0), SAMPLE_WIDTH, SAMPLE_HEIGHT))).toBe("no_signal");
  });

  it("reports no_signal for a frozen flat frame even when it is bright", () => {
    expect(classifyFrame(analyzeFrame(uniform(200), SAMPLE_WIDTH, SAMPLE_HEIGHT))).toBe("no_signal");
  });

  it("treats the exact band edges as ok", () => {
    // 0.25 and 0.85 luminance on a flat ramp would be flagged flat, so check the mean path directly.
    const base = { mean: 0.25, variance: 0.01, insideVariance: 0.01, outsideVariance: 0.01, insideCount: 1, outsideCount: 1 };
    expect(classifyFrame(base)).toBe("ok");
    expect(classifyFrame({ ...base, mean: 0.85 })).toBe("ok");
    expect(classifyFrame({ ...base, mean: 0.249 })).toBe("too_dark");
    expect(classifyFrame({ ...base, mean: 0.851 })).toBe("too_bright");
  });
});

describe("analyzeFrame", () => {
  it("splits pixels into inside and outside the guide", () => {
    // Bright centre block, dark border. Only the centre is inside the ellipse.
    const stats = analyzeFrame(
      frame((x, y) => (insideGuide((x + 0.5) / SAMPLE_WIDTH, (y + 0.5) / SAMPLE_HEIGHT) ? 200 : 50)),
      SAMPLE_WIDTH,
      SAMPLE_HEIGHT,
    );
    expect(stats.insideCount + stats.outsideCount).toBe(SAMPLE_WIDTH * SAMPLE_HEIGHT);
    expect(stats.insideCount).toBeGreaterThan(0);
    expect(stats.outsideCount).toBeGreaterThan(0);
    expect(stats.mean).toBeGreaterThan(0.25);
    expect(stats.mean).toBeLessThan(0.85);
  });

  it("gives zero variance for a uniform frame", () => {
    const stats = analyzeFrame(uniform(128), SAMPLE_WIDTH, SAMPLE_HEIGHT);
    expect(stats.variance).toBeCloseTo(0, 9);
    expect(stats.insideVariance).toBeCloseTo(0, 9);
    expect(stats.outsideVariance).toBeCloseTo(0, 9);
  });

  it("rejects a buffer that is too short", () => {
    expect(() => analyzeFrame(new Uint8ClampedArray(10), SAMPLE_WIDTH, SAMPLE_HEIGHT)).toThrow(RangeError);
  });
});

describe("centreRatio", () => {
  it("is high when the guide holds texture the rest of the frame lacks", () => {
    // Person-like texture in the guide, flat wall outside.
    const person = frame((x, y) => {
      const nx = (x + 0.5) / SAMPLE_WIDTH;
      const ny = (y + 0.5) / SAMPLE_HEIGHT;
      if (!insideGuide(nx, ny)) return 120;
      return (x + y) % 2 === 0 ? 60 : 200;
    });
    const empty = uniform(120);
    const withPerson = centreRatio(analyzeFrame(person, SAMPLE_WIDTH, SAMPLE_HEIGHT));
    const withoutPerson = centreRatio(analyzeFrame(empty, SAMPLE_WIDTH, SAMPLE_HEIGHT));
    expect(withPerson).toBeGreaterThan(1.5);
    expect(withoutPerson).toBeCloseTo(0, 3);
  });
});

describe("framingScore", () => {
  it("is the fraction of ok samples", () => {
    expect(framingScore(["ok", "ok", "too_dark", "ok"])).toBeCloseTo(0.75, 9);
  });

  it("is 0 when nothing was sampled", () => {
    expect(framingScore([])).toBe(0);
  });
});

describe("tipFor", () => {
  it("nudges the learner into the guide when lit but off-centre", () => {
    expect(tipFor("ok", 0.5)).toMatch(/Step into the guide/);
    expect(tipFor("ok", 3)).toMatch(/look good/);
  });

  it("never claims face detection", () => {
    for (const r of ["ok", "too_dark", "too_bright", "no_signal", null] as const) {
      expect(tipFor(r, 2).toLowerCase()).not.toContain("face detect");
    }
  });
});

describe("pickMimeType", () => {
  it("prefers vp9 with opus when supported", () => {
    expect(pickMimeType(() => true)).toBe("video/webm;codecs=vp9,opus");
  });

  it("falls back down the chain", () => {
    const only = (t: string) => t === "video/webm";
    expect(pickMimeType(only)).toBe("video/webm");
    expect(pickMimeType((t) => t === "video/mp4")).toBe("video/mp4");
  });

  it("returns null when nothing is supported", () => {
    expect(pickMimeType(() => false)).toBeNull();
  });
});
