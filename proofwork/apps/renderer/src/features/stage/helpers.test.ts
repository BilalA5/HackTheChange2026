import { describe, expect, it } from "vitest";
import {
  RAIL_DEFAULT_WIDTH,
  clampRailWidth,
  describeStageError,
  formatDuration,
  isGithubUrl,
  mergeChecklist,
  nextStageRoute,
  readRailWidth,
  validateSubmission,
  writeRailWidth,
  type SubmissionDraft,
} from "./helpers";

const emptyDraft: SubmissionDraft = { text: "", url: "", github: "", files: [] };

describe("clampRailWidth", () => {
  it("clamps to 272–460 and rounds", () => {
    expect(clampRailWidth(100)).toBe(272);
    expect(clampRailWidth(999)).toBe(460);
    expect(clampRailWidth(312.4)).toBe(312);
    expect(clampRailWidth(Number.NaN)).toBe(RAIL_DEFAULT_WIDTH);
  });
});

describe("rail width persistence", () => {
  it("reads defaults for missing or broken values and round-trips clamped writes", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    } as unknown as Storage;
    expect(readRailWidth(storage)).toBe(312);
    store.set("pw.stage.railWidth", "not-a-number");
    expect(readRailWidth(storage)).toBe(312);
    writeRailWidth(900, storage);
    expect(readRailWidth(storage)).toBe(460);
  });
});

describe("isGithubUrl", () => {
  it("accepts repository links on github.com only", () => {
    expect(isGithubUrl("https://github.com/acme/router")).toBe(true);
    expect(isGithubUrl("https://www.github.com/acme/router/pull/3")).toBe(true);
    expect(isGithubUrl("https://github.com/acme")).toBe(false);
    expect(isGithubUrl("https://gitlab.com/acme/router")).toBe(false);
    expect(isGithubUrl("ftp://github.com/acme/router")).toBe(false);
    expect(isGithubUrl("not a url")).toBe(false);
  });
});

describe("validateSubmission", () => {
  it("requires at least one submission", () => {
    const r = validateSubmission(["text"], emptyDraft);
    expect(r.valid).toBe(false);
    expect(r.errors.form).toBeTruthy();
  });

  it("collects text, url and files for the accepted kinds only", () => {
    const r = validateSubmission(["text", "url", "file"], {
      text: "  Notes  ",
      url: "https://example.com/demo",
      github: "https://github.com/ignored/ignored",
      files: [{ value: "https://files.local/a.pdf", fileName: "a.pdf" }],
    });
    expect(r.valid).toBe(true);
    expect(r.submissions).toEqual([
      { kind: "text", value: "Notes" },
      { kind: "url", value: "https://example.com/demo" },
      { kind: "file", value: "https://files.local/a.pdf", fileName: "a.pdf" },
    ]);
  });

  it("flags an invalid github link and blocks submission", () => {
    const r = validateSubmission(["github"], { ...emptyDraft, github: "https://gitlab.com/x/y" });
    expect(r.valid).toBe(false);
    expect(r.errors.github).toBeTruthy();
  });

  it("flags a url without a scheme", () => {
    const r = validateSubmission(["url"], { ...emptyDraft, url: "example.com" });
    expect(r.valid).toBe(false);
    expect(r.errors.url).toBeTruthy();
  });

  it("rejects text over the limit", () => {
    const r = validateSubmission(["text"], { ...emptyDraft, text: "x".repeat(20_001) });
    expect(r.valid).toBe(false);
    expect(r.errors.text).toBeTruthy();
  });
});

describe("nextStageRoute", () => {
  const stages = [
    { id: "s1", order: 1, kind: "work" as const },
    { id: "s3", order: 3, kind: "presentation" as const },
    { id: "s2", order: 2, kind: "work" as const },
  ];

  it("returns the next stage by order", () => {
    expect(nextStageRoute("obj-1", stages, "s1")).toEqual({ stageId: "s2", kind: "work", path: "/objective/obj-1/stage/s2" });
  });

  it("routes a presentation stage to /present", () => {
    expect(nextStageRoute("obj-1", stages, "s2")).toEqual({
      stageId: "s3",
      kind: "presentation",
      path: "/objective/obj-1/stage/s3/present",
    });
  });

  it("returns null for the last stage or an unknown stage", () => {
    expect(nextStageRoute("obj-1", stages, "s3")).toBeNull();
    expect(nextStageRoute("obj-1", stages, "nope")).toBeNull();
  });
});

describe("mergeChecklist", () => {
  it("uses the server todos once they exist", () => {
    const items = mergeChecklist(["Ship the router", "Write tests"], [{ id: "t1", text: "Ship router", done: true }]);
    expect(items).toEqual([{ id: "t1", text: "Ship router", done: true }]);
  });
  it("falls back to unticked requirements before the plan creates todos", () => {
    expect(mergeChecklist(["Ship router"], [])).toEqual([{ id: "req-0", text: "Ship router", done: false }]);
  });
});

describe("formatDuration", () => {
  it("formats short and long durations", () => {
    expect(formatDuration(30)).toBe("< 1 min");
    expect(formatDuration(720)).toBe("12 min");
    expect(formatDuration(3900)).toBe("1 h 5 min");
    expect(formatDuration(7200)).toBe("2 h");
  });
});

describe("describeStageError", () => {
  it("maps credits, conflict and forbidden responses", () => {
    expect(describeStageError({ status: 402, code: "insufficient_credits", message: "x" }).kind).toBe("credits");
    expect(describeStageError({ status: 409, code: "conflict", message: "x" }).kind).toBe("conflict");
    expect(describeStageError({ status: 403, code: "locked", message: "x" }).message).toMatch(/locked/);
    expect(describeStageError(new Error("boom")).message).toBe("boom");
  });
});
