import { describe, expect, it } from "vitest";
import type { Job, JobApplyField, Training, TrainingProgress } from "@pw/shared";
import {
  clampLessonIndex,
  companyInitials,
  filterJobs,
  filterTrainings,
  isValidEmail,
  isValidUrl,
  jobEligible,
  parseSpeed,
  stripMarkdown,
  trainingProgressRatio,
  trainingTags,
  validateAnswers,
} from "./careerHelpers";

const training = (over: Partial<Training> & Pick<Training, "id" | "kind">): Training => ({
  title: "Title",
  summary: "Summary",
  minutes: 10,
  tags: [],
  recommendedFor: [],
  lessons: [{ title: "One", body: "Body" }],
  ...over,
});

const trainings: Training[] = [
  training({ id: "a", kind: "skill", title: "Structured prompting", summary: "Contracts for models", tags: ["llm", "prompting"] }),
  training({ id: "b", kind: "skill", title: "Data hygiene", summary: "Clean sample data", tags: ["data", "llm"] }),
  training({ id: "c", kind: "mindset", title: "Own the outcome", summary: "Ownership and prompting habits", tags: ["ownership"] }),
  training({ id: "d", kind: "communication", title: "Status updates", summary: "Write short updates", tags: ["writing"] }),
];

describe("filterTrainings", () => {
  it("keeps only the requested kind", () => {
    expect(filterTrainings(trainings, { kind: "skill", query: "", tags: [] }).map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("matches search text against title, summary and tags, case-insensitively", () => {
    const ids = (query: string) => filterTrainings(trainings, { kind: "mindset", query, tags: [] }).map((t) => t.id);
    expect(ids("OWN")).toEqual(["c"]);
    expect(ids("habits")).toEqual(["c"]);
    expect(ids("ownership")).toEqual(["c"]);
    expect(ids("zebra")).toEqual([]);
  });

  it("ignores surrounding whitespace in the query", () => {
    expect(filterTrainings(trainings, { kind: "skill", query: "   prompting  ", tags: [] }).map((t) => t.id)).toEqual(["a"]);
  });

  it("filters by tag chips and matches any selected tag", () => {
    expect(filterTrainings(trainings, { kind: "skill", query: "", tags: ["data"] }).map((t) => t.id)).toEqual(["b"]);
    expect(filterTrainings(trainings, { kind: "skill", query: "", tags: ["prompting", "data"] }).map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("combines search and tags", () => {
    expect(filterTrainings(trainings, { kind: "skill", query: "clean", tags: ["llm"] }).map((t) => t.id)).toEqual(["b"]);
    expect(filterTrainings(trainings, { kind: "skill", query: "clean", tags: ["writing"] })).toEqual([]);
  });
});

describe("trainingTags", () => {
  it("lists sorted unique tags for one kind", () => {
    expect(trainingTags(trainings, "skill")).toEqual(["data", "llm", "prompting"]);
  });
});

describe("training progress helpers", () => {
  const p = (over: Partial<TrainingProgress>): TrainingProgress => ({
    trainingId: "a",
    lessonIndex: 0,
    completed: false,
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  });

  it("reports a completed training as full and an unknown one as empty", () => {
    expect(trainingProgressRatio(4, p({ lessonIndex: 3, completed: true }))).toBe(1);
    expect(trainingProgressRatio(4, undefined)).toBe(0);
    expect(trainingProgressRatio(4, p({ lessonIndex: 2 }))).toBe(0.5);
  });

  it("clamps lesson indexes into range", () => {
    expect(clampLessonIndex(9, 3)).toBe(2);
    expect(clampLessonIndex(-1, 3)).toBe(0);
    expect(clampLessonIndex(1.7, 3)).toBe(1);
    expect(clampLessonIndex(0, 0)).toBe(0);
  });
});

describe("speech helpers", () => {
  it("accepts only the offered speeds and falls back to 1", () => {
    expect(parseSpeed("1.5")).toBe(1.5);
    expect(parseSpeed("2")).toBe(2);
    expect(parseSpeed("3")).toBe(1);
    expect(parseSpeed(null)).toBe(1);
    expect(parseSpeed("fast")).toBe(1);
  });

  it("strips Markdown so the speech reads words, not syntax", () => {
    const out = stripMarkdown("## Title\n\n- **Bold** and `code` see [docs](https://x.y)\n1. Step");
    expect(out).toBe("Title Bold and code see docs Step");
    expect(out).not.toMatch(/[#*`\[\]]/);
  });
});

const job = (over: Partial<Job>): Job => ({
  id: "j",
  company: "Lanternfold Labs",
  title: "Junior",
  location: "London",
  remote: false,
  salary: "$70k",
  careerId: "ai-engineer",
  minLevel: 0,
  description: "",
  requirements: [],
  autoApplicable: true,
  applyFields: [],
  ...over,
});

describe("job eligibility", () => {
  it("is eligible when level meets or exceeds the minimum", () => {
    expect(jobEligible(job({ minLevel: 2 }), 2)).toBe(true);
    expect(jobEligible(job({ minLevel: 2 }), 3)).toBe(true);
    expect(jobEligible(job({ minLevel: 2 }), 1)).toBe(false);
  });

  it("filters by career, remote and eligibility together", () => {
    const jobs = [
      job({ id: "1", careerId: "ai-engineer", remote: true, minLevel: 0 }),
      job({ id: "2", careerId: "ai-engineer", remote: false, minLevel: 0 }),
      job({ id: "3", careerId: "product-manager", remote: true, minLevel: 3 }),
      job({ id: "4", careerId: "ai-engineer", remote: true, minLevel: 3 }),
    ];
    const ids = (f: { careerId: string; remoteOnly: boolean; eligibleOnly: boolean }, level: number) =>
      filterJobs(jobs, f, level).map((j) => j.id);

    expect(ids({ careerId: "all", remoteOnly: false, eligibleOnly: false }, 0)).toEqual(["1", "2", "3", "4"]);
    expect(ids({ careerId: "ai-engineer", remoteOnly: false, eligibleOnly: false }, 0)).toEqual(["1", "2", "4"]);
    expect(ids({ careerId: "all", remoteOnly: true, eligibleOnly: false }, 0)).toEqual(["1", "3", "4"]);
    expect(ids({ careerId: "all", remoteOnly: false, eligibleOnly: true }, 1)).toEqual(["1", "2"]);
    expect(ids({ careerId: "all", remoteOnly: false, eligibleOnly: true }, 3)).toEqual(["1", "2", "3", "4"]);
    expect(ids({ careerId: "ai-engineer", remoteOnly: true, eligibleOnly: true }, 1)).toEqual(["1"]);
  });

  it("builds monograms from company names", () => {
    expect(companyInitials("Lanternfold Labs")).toBe("LL");
    expect(companyInitials("Kettle")).toBe("KE");
    expect(companyInitials("  ")).toBe("?");
  });
});

const field = (over: Partial<JobApplyField> & Pick<JobApplyField, "key">): JobApplyField => ({
  label: over.key,
  type: "text",
  required: true,
  ...over,
});

describe("validateAnswers", () => {
  const fields: JobApplyField[] = [
    field({ key: "full_name", label: "Full name" }),
    field({ key: "email", label: "Email", type: "email" }),
    field({ key: "portfolio_url", label: "Portfolio", type: "url" }),
    field({ key: "years", label: "Years", type: "select", options: ["0–1 years", "2–3 years"] }),
    field({ key: "start", label: "Start", required: false }),
  ];

  it("reports every missing required field and skips optional blanks", () => {
    const errs = validateAnswers(fields, {});
    expect(Object.keys(errs).sort()).toEqual(["email", "full_name", "portfolio_url", "years"]);
    expect(errs.full_name).toBe("Full name is required.");
  });

  it("treats whitespace-only answers as missing", () => {
    expect(validateAnswers([field({ key: "a", label: "A" })], { a: "   " })).toEqual({ a: "A is required." });
  });

  it("returns no errors when the form is complete and well formed", () => {
    expect(
      validateAnswers(fields, {
        full_name: "Ada Lovelace",
        email: "ada@example.com",
        portfolio_url: "https://github.com/ada",
        years: "2–3 years",
      }),
    ).toEqual({});
  });

  it("checks email, link and select formats", () => {
    const errs = validateAnswers(fields, {
      full_name: "Ada",
      email: "not-an-email",
      portfolio_url: "ftp://nope",
      years: "10+",
    });
    expect(errs.email).toMatch(/email/i);
    expect(errs.portfolio_url).toMatch(/https/);
    expect(errs.years).toMatch(/listed options/);
  });

  it("validates email and url helpers on their own", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidUrl("https://x.dev/p")).toBe(true);
    expect(isValidUrl("x.dev")).toBe(false);
  });
});
