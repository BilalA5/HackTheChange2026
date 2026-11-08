// Live personal career path. Two model steps, then code:
//   1. OUTLINE (quality): career, 3 companies, 3 managers, 3 project outlines with keyFacts and stage titles.
//   2. DETAIL (quality, 9 calls in parallel): per project, the kickoff + Proof of Understanding, stages 1-2 and
//      stages 3-4. Small calls with low thinking keep the whole path under about a minute.
//   3. ASSEMBLE (code): every id follows idPrefix, orders, stage XP, maxXp, map positions, colours.
// In parallel with all of this, one fast call writes the five job postings (practice jobs if it fails).
// Then VALIDATE with @pw/content. A failed part is retried once (parts that succeeded are kept); if anything
// still fails the caller gets the practice generator's output instead, so the two engines are never mixed.
import { validateCareerPack, validateJobs } from "@pw/content";
import { RUBRIC_AXES } from "@pw/shared";
import type {
  Career,
  CareerPack,
  Company,
  Deliverable,
  Difficulty,
  Job,
  KickoffSegment,
  LearnItem,
  Npc,
  PathRequest,
  PouQuestion,
  RubricAxis,
  Scenario,
  Slide,
  Stage,
  SubmissionKind,
} from "@pw/shared";
import type { GeneratedPath, GeneratePathInput } from "../../contracts.ts";
import type { JsonSchema, LlmClient } from "../llm.ts";
import { recommendTrainings } from "../mock/pathgen/index.ts";
import { obj } from "./common.ts";

/** Per-request timeout for each of the path's model calls. */
export const PATH_TIMEOUT_MS = 90_000;

const DIFFICULTIES: readonly Difficulty[] = ["beginner", "intermediate", "advanced"];
const KINDS: readonly SubmissionKind[] = ["text", "url", "github", "file", "recording"];
const BUILDINGS: readonly Company["building"][] = ["tower", "campus", "dome", "loft", "hangar", "spire"];
const NOTE_SECTIONS = ["problem", "outcome", "process"] as const;
const VISUALS = ["metric", "quote", "flow", "chart", "none"] as const;
const MAP = [
  { x: 20, y: 32 },
  { x: 40, y: 26 },
  { x: 58, y: 40 },
] as const;
const DEFAULT_CAREER_COLOR = "#7B6CF6";
const DEFAULT_COMPANY_COLOR = "#2f6fed";
const HEX = /^#[0-9a-fA-F]{6}$/;

// ───────────────────────────── model output shapes ─────────────────────────────

interface OutlineScenario {
  title: string;
  coverWord: string;
  problemStatement: string;
  userRole: string;
  projectType: string;
  difficulty: Difficulty;
  estMinutes: number;
  tools: string[];
  workflows: string[];
  skills: string[];
  deliverables: Deliverable[];
  keyFacts: string[];
  /** Four stage titles; the fourth is the presentation. They keep the separately written stages coherent. */
  stageTitles: string[];
}

export interface Outline {
  career: { title: string; tagline: string; description: string; skills: string[]; color: string };
  companies: { name: string; industry: string; tagline: string; color: string; glyph: string; building: Company["building"] }[];
  npcs: { name: string; role: string; personality: string }[];
  scenarios: OutlineScenario[];
}

type Chk = NonNullable<LearnItem["check"]>;

export interface Detail {
  segments: { title: string; slides: Slide[]; transcript: string; rubricPoints: string[]; checkpointPrompt: string }[];
  pou: { prompt: string; rubricPoints: string[]; followUp: string }[];
  stages: {
    title: string;
    summary: string;
    estMinutes: number;
    requirements: string[];
    planOpener: string;
    learn: { title: string; minutes: number; body: string; check?: Chk };
    submission: { kinds: SubmissionKind[]; instructions: string };
    rubricHints: Record<RubricAxis, string>;
  }[];
}

// ───────────────────────────── JSON schemas (plain subset) ─────────────────────────────

const STR: JsonSchema = { type: "string" };
// Counts are enforced by validation and stated in the prompts. Gemini rejects nested minItems/maxItems
// ("Request contains an invalid argument") once a detail schema is large, so the schema leaves them out.
const strs = (_min: number, _max: number): JsonSchema => ({ type: "array", items: { type: "string" } });
const exactly = (_n: number, items: JsonSchema): JsonSchema => ({ type: "array", items });

const OUTLINE_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    career: {
      type: "object",
      properties: { title: STR, tagline: STR, description: STR, skills: strs(6, 8), color: STR },
      required: ["title", "tagline", "description", "skills", "color"],
    },
    companies: {
      ...exactly(3, {
        type: "object",
        properties: {
          name: STR,
          industry: STR,
          tagline: STR,
          color: STR,
          glyph: STR,
          building: { type: "string", enum: [...BUILDINGS] },
        },
        required: ["name", "industry", "tagline", "color", "glyph", "building"],
      }),
    },
    npcs: {
      ...exactly(3, {
        type: "object",
        properties: { name: STR, role: STR, personality: STR },
        required: ["name", "role", "personality"],
      }),
    },
    scenarios: {
      ...exactly(3, {
        type: "object",
        properties: {
          title: STR,
          coverWord: STR,
          problemStatement: STR,
          userRole: STR,
          projectType: STR,
          difficulty: { type: "string", enum: [...DIFFICULTIES] },
          estMinutes: { type: "integer" },
          tools: strs(1, 8),
          workflows: strs(1, 5),
          skills: strs(2, 6),
          deliverables: exactly(2, {
            type: "object",
            properties: { title: STR, description: STR, kind: { type: "string", enum: [...KINDS] } },
            required: ["title", "description", "kind"],
          }),
          keyFacts: strs(4, 6),
          stageTitles: strs(4, 4),
        },
        required: [
          "title",
          "coverWord",
          "problemStatement",
          "userRole",
          "projectType",
          "difficulty",
          "estMinutes",
          "tools",
          "workflows",
          "skills",
          "deliverables",
          "keyFacts",
          "stageTitles",
        ],
      }),
    },
  },
  required: ["career", "companies", "npcs", "scenarios"],
};

const SLIDE_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    heading: STR,
    bullets: strs(1, 4),
    visual: { type: "string", enum: [...VISUALS] },
    metric: { type: "object", properties: { label: STR, value: STR }, required: ["label", "value"] },
    quote: { type: "object", properties: { text: STR, author: STR }, required: ["text", "author"] },
    flow: strs(2, 5),
    chart: {
      type: "array",
      items: { type: "object", properties: { label: STR, value: { type: "number" } }, required: ["label", "value"] },
    },
  },
  required: ["heading", "bullets", "visual"],
};

const SEGMENT_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    title: STR,
    slides: { type: "array", items: SLIDE_SCHEMA },
    transcript: STR,
    rubricPoints: strs(3, 4),
    checkpointPrompt: STR,
  },
  required: ["title", "slides", "transcript", "rubricPoints", "checkpointPrompt"],
};

const POU_SCHEMA: JsonSchema = {
  type: "object",
  properties: { prompt: STR, rubricPoints: strs(2, 3), followUp: STR },
  required: ["prompt", "rubricPoints", "followUp"],
};

const LEARN_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    title: STR,
    minutes: { type: "integer" },
    body: STR,
    check: {
      type: "object",
      properties: {
        question: STR,
        options: strs(3, 4),
        answerIndex: { type: "integer" },
        explanation: STR,
      },
      required: ["question", "options", "answerIndex", "explanation"],
    },
  },
  required: ["title", "minutes", "body"],
};

const STAGE_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    title: STR,
    summary: STR,
    estMinutes: { type: "integer" },
    requirements: strs(3, 4),
    planOpener: STR,
    learn: { type: "array", items: LEARN_SCHEMA },
    submission: {
      type: "object",
      properties: { kinds: { type: "array", items: { type: "string", enum: [...KINDS] } }, instructions: STR },
      required: ["kinds", "instructions"],
    },
    rubricHints: {
      type: "object",
      properties: Object.fromEntries(RUBRIC_AXES.map((a) => [a, STR])),
      required: [...RUBRIC_AXES],
    },
  },
  required: ["title", "summary", "estMinutes", "requirements", "planOpener", "learn", "submission", "rubricHints"],
};

const KICKOFF_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    segments: exactly(3, SEGMENT_SCHEMA),
    pou: exactly(2, POU_SCHEMA),
  },
  required: ["segments", "pou"],
};

const STAGES_SCHEMA: JsonSchema = {
  type: "object",
  properties: { stages: exactly(2, STAGE_SCHEMA) },
  required: ["stages"],
};

// ───────────────────────────── validation and clamping ─────────────────────────────

function text(v: unknown, name: string, max: number): string {
  if (typeof v !== "string" || !v.trim()) throw new Error(`invalid ${name}`);
  return v.trim().slice(0, max);
}

function list(v: unknown, name: string, min: number, max: number, itemMax = 240): string[] {
  if (!Array.isArray(v)) throw new Error(`invalid ${name}`);
  const items = v
    .filter((x): x is string => typeof x === "string" && x.trim() !== "")
    .map((x) => x.trim().slice(0, itemMax))
    .slice(0, max);
  if (items.length < min) throw new Error(`invalid ${name}: ${items.length} items`);
  return items;
}

function arr(v: unknown, min: number, name: string): unknown[] {
  if (!Array.isArray(v) || v.length < min) throw new Error(`invalid ${name}`);
  return v;
}

function int(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.min(max, Math.max(min, n));
}

function pick<T extends string>(v: unknown, options: readonly T[], fallback: T): T {
  return typeof v === "string" && (options as readonly string[]).includes(v) ? (v as T) : fallback;
}

function hex(v: unknown, fallback: string): string {
  return typeof v === "string" && HEX.test(v.trim()) ? v.trim() : fallback;
}

const wordCount = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

/** Keeps whole sentences up to `max` words. A single over-long sentence is cut at `max` words. */
export function clampWords(t: string, max: number): string {
  const sentences = t.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/);
  const kept: string[] = [];
  let n = 0;
  for (const s of sentences) {
    const w = wordCount(s);
    if (n + w > max) break;
    kept.push(s);
    n += w;
  }
  if (kept.length) return kept.join(" ");
  return t.trim().split(/\s+/).slice(0, max).join(" ");
}

/** Transcripts must be 60-220 words for the validator. Too short is rejected (retried); too long is trimmed. */
function transcript(v: unknown): string {
  const t = text(v, "transcript", 4000);
  const w = wordCount(t);
  if (w < 60) throw new Error(`transcript too short (${w} words)`);
  return w > 220 ? clampWords(t, 200) : t;
}

/** A plan opener always ends with a question. */
function opener(v: string): string {
  if (v.endsWith("?")) return v;
  return `${v.replace(/[.!:;,]+$/, "")}. Does that scope work for you?`;
}

function slide(v: unknown): Slide {
  const r = obj(v, "slide");
  const out: Slide = { heading: text(r.heading, "slide heading", 120), bullets: list(r.bullets, "bullets", 1, 4, 240), visual: "none" };
  const visual = pick(r.visual, VISUALS, "none");
  if (visual === "metric" && isRecord(r.metric)) {
    const m = r.metric;
    out.visual = "metric";
    out.metric = { label: text(m.label, "metric label", 60), value: text(m.value, "metric value", 40) };
  } else if (visual === "quote" && isRecord(r.quote)) {
    const q = r.quote;
    out.visual = "quote";
    out.quote = { text: text(q.text, "quote", 300), author: text(q.author, "quote author", 80) };
  } else if (visual === "flow") {
    out.visual = "flow";
    out.flow = list(r.flow, "flow", 2, 5, 80);
  } else if (visual === "chart" && Array.isArray(r.chart)) {
    const bars = r.chart
      .filter(isRecord)
      .map((b) => ({ label: text(b.label, "chart label", 40), value: int(b.value, 0, 100, 0) }))
      .slice(0, 5);
    if (bars.length < 2) throw new Error("chart needs at least 2 bars");
    out.visual = "chart";
    out.chart = bars;
  }
  return out;
}

function checkOf(v: unknown): Chk | undefined {
  if (!isRecord(v)) return undefined;
  const options = list(v.options, "check options", 3, 4, 200);
  const answerIndex = typeof v.answerIndex === "number" ? Math.trunc(v.answerIndex) : -1;
  if (answerIndex < 0 || answerIndex >= options.length) return undefined;
  return { question: text(v.question, "check question", 300), options, answerIndex, explanation: text(v.explanation, "check explanation", 400) };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

type KickoffPart = Pick<Detail, "segments" | "pou">;

/** Validates and clamps the kickoff part: 3 segments and 2 Proof of Understanding questions. */
export function validateKickoffPart(raw: unknown): KickoffPart {
  const d = obj(raw, "detail");
  const segments = arr(d.segments, 3, "segments").map((sv) => {
    const r = obj(sv, "segment");
    return {
      title: text(r.title, "segment title", 120),
      slides: arr(r.slides, 2, "slides").slice(0, 3).map(slide),
      transcript: transcript(r.transcript),
      rubricPoints: list(r.rubricPoints, "rubricPoints", 3, 4, 200),
      checkpointPrompt: text(r.checkpointPrompt, "checkpointPrompt", 300),
    };
  });
  const pou = arr(d.pou, 2, "pou").map((qv) => {
    const r = obj(qv, "pou question");
    return {
      prompt: text(r.prompt, "pou prompt", 400),
      rubricPoints: list(r.rubricPoints, "pou rubricPoints", 2, 3, 200),
      followUp: text(r.followUp, "pou followUp", 300),
    };
  });
  return { segments, pou };
}

/** Validates and clamps a stages part: the first `count` stages of the response. */
export function validateStagesPart(raw: unknown, count: number): Detail["stages"] {
  const d = obj(raw, "detail");
  return arr(d.stages, count, "stages").slice(0, count).map((sv) => {
    const r = obj(sv, "stage");
    const l = obj(arr(r.learn, 1, "learn")[0], "learn item");
    const body = text(l.body, "learn body", 4000);
    const hints = obj(r.rubricHints, "rubricHints");
    const submission = obj(r.submission, "submission");
    const kinds = Array.isArray(submission.kinds)
      ? submission.kinds.filter((k): k is SubmissionKind => (KINDS as readonly string[]).includes(k as string))
      : [];
    return {
      title: text(r.title, "stage title", 120),
      summary: text(r.summary, "stage summary", 400),
      estMinutes: int(r.estMinutes, 10, 180, 45),
      requirements: list(r.requirements, "requirements", 3, 4, 240),
      planOpener: opener(text(r.planOpener, "planOpener", 400)),
      learn: {
        title: text(l.title, "learn title", 120),
        minutes: int(l.minutes, 3, 20, 5),
        body: wordCount(body) > 300 ? clampWords(body, 280) : body,
        check: checkOf(l.check),
      },
      submission: {
        kinds: kinds.length ? [...new Set(kinds)] : (["text"] as SubmissionKind[]),
        instructions: text(submission.instructions, "submission instructions", 400),
      },
      rubricHints: Object.fromEntries(
        RUBRIC_AXES.map((a) => [a, typeof hints[a] === "string" && hints[a] ? (hints[a] as string).trim().slice(0, 300) : "Meets the agreed requirements for this stage."]),
      ) as Record<RubricAxis, string>,
    };
  });
}

/** Validates and clamps one whole project detail (kickoff, PoU and 4 stages). Throws when it cannot be used. */
export function validateDetail(raw: unknown): Detail {
  return { ...validateKickoffPart(raw), stages: validateStagesPart(raw, 4) };
}

const DEFAULT_STAGE_TITLES = ["Scope the work", "Do the core work", "Check and refine", "Present to the team"];

/** Four stage titles. Missing or extra titles fall back to defaults so one weak field never sinks the outline. */
function stageTitlesOf(v: unknown): string[] {
  const given = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim().slice(0, 100)) : [];
  return DEFAULT_STAGE_TITLES.map((fallback, i) => given[i] ?? fallback);
}

export function validateOutline(raw: unknown): Outline {
  const o = obj(raw, "outline");
  const c = obj(o.career, "career");
  const companies = arr(o.companies, 3, "companies").map((x) => {
    const r = obj(x, "company");
    return {
      name: text(r.name, "company name", 60),
      industry: text(r.industry, "industry", 60),
      tagline: text(r.tagline, "company tagline", 140),
      color: hex(r.color, DEFAULT_COMPANY_COLOR),
      glyph: text(r.glyph, "glyph", 2).toUpperCase(),
      building: pick(r.building, BUILDINGS, "tower"),
    };
  });
  const npcs = arr(o.npcs, 3, "npcs").map((x) => {
    const r = obj(x, "npc");
    return { name: text(r.name, "npc name", 60), role: text(r.role, "npc role", 80), personality: text(r.personality, "personality", 400) };
  });
  const scenarios = arr(o.scenarios, 3, "scenarios").map((x, idx) => {
    const r = obj(x, "scenario");
    return {
      title: text(r.title, "title", 120),
      coverWord: text(r.coverWord, "coverWord", 40).toUpperCase().split(/\s+/).slice(0, 3).join(" "),
      problemStatement: text(r.problemStatement, "problemStatement", 500),
      userRole: text(r.userRole, "userRole", 160),
      projectType: text(r.projectType, "projectType", 60),
      difficulty: pick(r.difficulty, DIFFICULTIES, DIFFICULTIES[idx]),
      estMinutes: int(r.estMinutes, 30, 240, 90),
      tools: list(r.tools, "tools", 1, 8, 60),
      workflows: list(r.workflows, "workflows", 1, 5, 80),
      skills: list(r.skills, "skills", 2, 6, 60),
      deliverables: arr(r.deliverables, 2, "deliverables")
        .slice(0, 2)
        .map((d) => {
          const dr = obj(d, "deliverable");
          return { title: text(dr.title, "deliverable title", 100), description: text(dr.description, "deliverable description", 300), kind: pick(dr.kind, KINDS, "text") };
        }),
      keyFacts: list(r.keyFacts, "keyFacts", 4, 6, 200),
      stageTitles: stageTitlesOf(r.stageTitles),
    };
  });
  return {
    career: {
      title: text(c.title, "career title", 60),
      tagline: text(c.tagline, "career tagline", 140),
      description: text(c.description, "career description", 600),
      skills: list(c.skills, "career skills", 6, 8, 64),
      color: hex(c.color, DEFAULT_CAREER_COLOR),
    },
    companies,
    npcs,
    scenarios,
  };
}

// ───────────────────────────── assembly (ids, orders, XP, map) ─────────────────────────────

/** FNV-1a. Stable across runs, so the same id always gets the same XP and voice. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildCompany(prefix: string, n: number, c: Outline["companies"][number], used: Set<string>): Company {
  let building: Company["building"] = c.building;
  if (used.has(building)) building = BUILDINGS.find((b) => !used.has(b)) ?? building;
  used.add(building);
  return { id: `${prefix}-c${n + 1}`, name: c.name, industry: c.industry, tagline: c.tagline, color: c.color, glyph: c.glyph, building };
}

function buildNpc(prefix: string, n: number, m: Outline["npcs"][number], companyId: string): Npc {
  const id = `${prefix}-n${n + 1}`;
  const h = hash(id);
  return {
    id,
    name: m.name,
    role: m.role,
    companyId,
    personality: m.personality,
    voice: { rate: Math.round((0.95 + (h % 16) / 100) * 100) / 100, pitch: Math.round((0.9 + ((h >>> 4) % 26) / 100) * 100) / 100 },
    avatarSeed: id,
  };
}

function buildStages(sid: string, stages: Detail["stages"]): Stage[] {
  return stages.map((st, k) => {
    const id = `${sid}-s${k + 1}`;
    const kind: Stage["kind"] = k === stages.length - 1 ? "presentation" : "work";
    const h = hash(id);
    const learn: LearnItem[] = [
      {
        id: `${id}-l1`,
        title: st.learn.title,
        minutes: st.learn.minutes,
        body: st.learn.body,
        ...(st.learn.check ? { check: st.learn.check } : {}),
      },
    ];
    return {
      id,
      order: k + 1,
      title: st.title,
      summary: st.summary,
      estMinutes: st.estMinutes,
      kind,
      requirements: st.requirements,
      planOpener: st.planOpener,
      learn,
      submission: st.submission,
      rubricHints: st.rubricHints,
      // Work stages 150-250 XP, the presentation 200-300 XP.
      xp: kind === "work" ? 150 + (h % 101) : 200 + (h % 101),
    };
  });
}

function buildScenario(prefix: string, n: number, o: OutlineScenario, companyId: string, npcId: string, d: Detail): Scenario {
  const sid = `${prefix}-s${n + 1}`;
  const stages = buildStages(sid, d.stages);
  const stageXp = stages.reduce((sum, s) => sum + s.xp, 0);
  const segments: KickoffSegment[] = d.segments.map((sg, k) => ({
    id: `${sid}-k${k + 1}`,
    title: sg.title,
    noteSection: NOTE_SECTIONS[k],
    slides: sg.slides,
    transcript: sg.transcript,
    rubricPoints: sg.rubricPoints,
    checkpointPrompt: sg.checkpointPrompt,
  }));
  const pou: PouQuestion[] = d.pou.map((q, k) => ({ id: `${sid}-q${k + 1}`, prompt: q.prompt, rubricPoints: q.rubricPoints, followUp: q.followUp }));
  return {
    id: sid,
    careerId: prefix,
    companyId,
    npcId,
    order: n + 1,
    title: o.title,
    coverWord: o.coverWord,
    problemStatement: o.problemStatement,
    userRole: o.userRole,
    projectType: o.projectType,
    difficulty: o.difficulty,
    // The card's time must agree with the brief's stage list, so it is the stage total (nearest 15 minutes).
    estMinutes: Math.max(30, Math.round(stages.reduce((sum, s) => sum + s.estMinutes, 0) / 15) * 15),
    maxXp: Math.round((stageXp + 550) / 5) * 5,
    tools: o.tools,
    workflows: o.workflows,
    skills: o.skills,
    deliverables: o.deliverables,
    kickoff: { segments },
    pou,
    stages,
    map: { ...MAP[n] },
  };
}

/** Validator problems that belong to one project. Pack-wide checks run once on the whole pack. */
function projectProblems(scenario: Scenario, career: Career, companies: Company[], npcs: Npc[]): string[] {
  return validateCareerPack({ career, companies, npcs, scenarios: [scenario] }).filter((p) => p.includes(scenario.id));
}

// ───────────────────────────── jobs (fast tier, best effort) ─────────────────────────────

const JOBS_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    jobs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: STR,
          company: STR,
          location: STR,
          remote: { type: "boolean" },
          salary: STR,
          minLevel: { type: "integer" },
          description: STR,
          requirements: strs(3, 5),
        },
        required: ["title", "company", "location", "remote", "salary", "minLevel", "description", "requirements"],
      },
    },
  },
  required: ["jobs"],
};

const JOBS_SYSTEM = `
You write five fictional job postings for a learner's job portal in Proofwork, a job simulation. They are openings the learner could apply to after finishing their personal path.
Rules:
- Invent fictional employers, all different. Never use a real company, brand or public figure.
- Titles fit the target role and sit on a ladder around the learner's level: one at or below it, two at it, two a step above.
- location: the learner's location when given, otherwise "Remote". remote is true when the job can be done remotely.
- salary: a realistic range for that location with the currency, for example "$62,000 to $70,000 CAD".
- minLevel: 0 entry, 1 junior, 2 mid, 3 senior, 4 lead.
- description: 2 sentences on what the job does and the team it sits in.
- requirements: 3-5 short, specific requirements.
Answer with JSON only.
`.trim();

type JobDraft = Pick<Job, "title" | "company" | "location" | "remote" | "salary" | "minLevel" | "description" | "requirements">;

export function validateJobsPart(raw: unknown): JobDraft[] {
  const d = obj(raw, "jobs");
  return arr(d.jobs, 5, "jobs")
    .slice(0, 5)
    .map((x) => {
      const r = obj(x, "job");
      return {
        title: text(r.title, "job title", 80),
        company: text(r.company, "job company", 60),
        location: text(r.location, "job location", 60),
        remote: r.remote === true,
        salary: text(r.salary, "salary", 60),
        minLevel: int(r.minLevel, 0, 4, 1),
        description: text(r.description, "job description", 500),
        requirements: list(r.requirements, "job requirements", 3, 5, 200),
      };
    });
}

/** Five live job postings around the path. Any failure returns the practice jobs, which always validate. */
async function jobsLive(llm: LlmClient, input: GeneratePathInput, practice: GeneratedPath): Promise<Job[]> {
  const prefix = input.idPrefix;
  try {
    const drafts = await llm.json<JobDraft[]>({
      tier: "fast",
      system: JOBS_SYSTEM,
      content: `Learner request:\n<jobs_request>\n${requestBlock(input.request)}\n</jobs_request>`,
      schema: JOBS_SCHEMA,
      maxTokens: 4000,
      timeoutMs: PATH_TIMEOUT_MS,
      validate: validateJobsPart,
    });
    const jobs: Job[] = drafts.map((draft, n) => {
      const template = practice.jobs[n % practice.jobs.length];
      return {
        ...draft,
        id: `${prefix}-j${n + 1}`,
        careerId: prefix,
        autoApplicable: template.autoApplicable,
        applyFields: template.applyFields.map((f) => (f.key === "motivation" ? { ...f, label: `Why ${draft.company}?` } : f)),
      };
    });
    return validateJobs(jobs, [prefix]).length === 0 ? jobs : practice.jobs;
  } catch {
    return practice.jobs;
  }
}

// ───────────────────────────── prompts ─────────────────────────────

const OUTLINE_SYSTEM = `
You design a personal career path in Proofwork, a job simulation. A learner works through three projects with an AI manager.
Tailor every field to the learner's request: target role, level, industry, company type, location, timeline, and their own why and background.
Rules:
- Invent FICTIONAL companies and people. Never use a real company, brand or public figure.
- career: a role title, a one-line tagline, a 2-3 sentence description, 6-8 skills of 1-4 words each, and a #rrggbb colour.
- companies: exactly 3, all in the requested industry. Each has a different building (tower, campus, dome, loft, hangar, spire) and a 1-2 letter glyph.
- npcs: exactly 3 managers, one per company, each a level above the learner. personality is 2 sentences on how they talk and what they check.
- scenarios: exactly 3 projects in this order. Project 1 diagnoses a problem. Project 2 builds or improves the role's core artifact. Project 3 launches or scales the work. Difficulty goes beginner, intermediate, advanced.
- Project i is run by companies[i] and npcs[i].
- keyFacts: 4-6 concrete numbers, sizes, budgets, deadlines or constraints. The rest of the project must reuse them exactly.
- coverWord: 2-3 UPPERCASE words for the project card.
- stageTitles: exactly 4 short stage titles in order. Stages 1-3 are work stages that produce the deliverables; stage 4 is the final presentation to the manager or team.
Answer with JSON only.
`.trim();

const PATH_INTRO = (n: number) =>
  `You write part of project ${n} of 3 in a personal career path in Proofwork, a job simulation. The learner works with an AI manager from the company in the brief.
Ground everything in the brief's keyFacts and reuse their exact numbers. Invent no real companies, people or brands.`;

const kickoffSystem = (n: number) => `
${PATH_INTRO(n)}
Write the kickoff meeting and the Proof of Understanding.
Kickoff: exactly 3 segments in this order: problem, outcome, process. Each has 2 or 3 slides. A slide's visual is "metric" (fill metric), "quote" (fill quote), "flow" (fill flow with 3-5 steps), "chart" (fill chart with 3-5 bars, values 0-100) or "none". Bullets are short.
Each segment transcript is 90-160 words, spoken in the manager's first-person voice, specific and concrete. rubricPoints are 3-4 short points a learner's note must cover, restating facts from the transcript. checkpointPrompt asks the learner for their note on that section.
${n === 1 ? "The learner's why and background are in the request. Work them into the first segment's transcript naturally and briefly, as the manager's reason to hire or to pair them on this." : ""}
Proof of Understanding: exactly 2 questions the manager asks after the kickoff. Each has a prompt, 2-3 rubricPoints and one followUp question for a partial answer.
Answer with JSON only.
`.trim();

const stagesSystem = (n: number, first: number) => `
${PATH_INTRO(n)}
Write exactly 2 stages: stages ${first} and ${first + 1} of the project's 4, using the titles in the brief's stageTitles. ${first === 3 ? "Stage 3 is the last work stage. Stage 4 is the final presentation to the team." : "Both are work stages."}
Each stage has a title, summary, estMinutes (work 45-120, presentation 20-40), 3-4 requirements, a planOpener of 1-2 sentences that ends with a question, and exactly one learn item: a title, minutes (3-10), a markdown body of 150-260 words that is practical and specific, and a check with a question, 3-4 options, a 0-based answerIndex and an explanation. submission.kinds is chosen from text, url, github, file, recording${first === 3 ? " (the presentation uses recording)" : ""}. rubricHints gives one sentence per axis (understanding, quality, communication, independence) describing what meeting expectations looks like for this stage.
Answer with JSON only.
`.trim();

function requestBlock(r: PathRequest): string {
  const lines = [
    `Target role: ${r.targetRole}`,
    r.level ? `Level: ${r.level}` : "",
    r.industry ? `Industry: ${r.industry}` : "",
    r.companyType ? `Company type: ${r.companyType}` : "",
    r.location ? `Location: ${r.location}` : "",
    r.timeline ? `Timeline: ${r.timeline}` : "",
    r.why ? `Why (learner's words): ${r.why.slice(0, 600)}` : "",
    r.background ? `Background (learner's words): ${r.background.slice(0, 600)}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

// ───────────────────────────── the generator ─────────────────────────────

interface ProjectJob {
  n: number;
  prefix: string;
  outline: OutlineScenario;
  career: Career;
  companies: Company[];
  npcs: Npc[];
  request: PathRequest;
  outlineCareer: Outline["career"];
}

type Part = "kickoff" | "stagesA" | "stagesB";
const PARTS: readonly Part[] = ["kickoff", "stagesA", "stagesB"];
type PartResult = KickoffPart | Detail["stages"];

function callPart(llm: LlmClient, job: ProjectJob, part: Part, brief: string): Promise<PartResult> {
  const content = `Learner request:\n<learner_request>\n${requestBlock(job.request)}\n</learner_request>\n\nBrief (part ${part}):\n<brief>\n${brief}\n</brief>`;
  const common = { tier: "quality" as const, content, maxTokens: 8000, timeoutMs: PATH_TIMEOUT_MS, thinking: "low" as const };
  if (part === "kickoff") {
    return llm.json<PartResult>({ ...common, system: kickoffSystem(job.n + 1), schema: KICKOFF_SCHEMA, validate: validateKickoffPart });
  }
  const first = part === "stagesA" ? 1 : 3;
  return llm.json<PartResult>({ ...common, system: stagesSystem(job.n + 1, first), schema: STAGES_SCHEMA, validate: (raw) => validateStagesPart(raw, 2) });
}

/**
 * One project: three part calls in parallel, assemble, validate. A failed part gets exactly one retry and parts
 * that succeeded are kept; if the assembled project is invalid, all three parts are asked again once.
 */
async function projectWithRetry(llm: LlmClient, job: ProjectJob): Promise<Scenario> {
  const company = job.companies[job.n];
  const npc = job.npcs[job.n];
  const sid = `${job.prefix}-s${job.n + 1}`;
  const brief = JSON.stringify({
    career: { title: job.outlineCareer.title, tagline: job.outlineCareer.tagline },
    project: { number: job.n + 1, title: job.outline.title, projectType: job.outline.projectType, userRole: job.outline.userRole, problemStatement: job.outline.problemStatement, tools: job.outline.tools, workflows: job.outline.workflows, skills: job.outline.skills, deliverables: job.outline.deliverables, keyFacts: job.outline.keyFacts, stageTitles: job.outline.stageTitles },
    company: { name: company.name, industry: company.industry, tagline: company.tagline },
    manager: { name: npc.name, role: npc.role, personality: npc.personality },
  });
  const done = new Map<Part, PartResult>();
  let lastError: unknown = new Error("no attempt made");
  for (let attempt = 0; attempt < 2; attempt++) {
    const todo = PARTS.filter((p) => !done.has(p));
    const settled = await Promise.allSettled(todo.map((p) => callPart(llm, job, p, brief)));
    settled.forEach((r, i) => {
      if (r.status === "fulfilled") done.set(todo[i], r.value);
      else lastError = r.reason;
    });
    if (done.size < PARTS.length) continue;

    const kickoff = done.get("kickoff") as KickoffPart;
    const stages = [...(done.get("stagesA") as Detail["stages"]), ...(done.get("stagesB") as Detail["stages"])];
    const scenario = buildScenario(job.prefix, job.n, job.outline, company.id, npc.id, { ...kickoff, stages });
    const problems = projectProblems(scenario, job.career, job.companies, job.npcs);
    if (problems.length === 0) return scenario;
    lastError = new Error(`${sid} invalid: ${problems.slice(0, 3).join("; ")}`);
    done.clear();
  }
  throw lastError;
}

/**
 * Generates the personal path with the live model. Throws on any failure; the caller then uses the practice
 * output. Jobs come from a parallel fast call; when that fails the practice jobs (careerId = idPrefix) are used.
 */
export async function generatePathLive(llm: LlmClient, input: GeneratePathInput, practice: GeneratedPath): Promise<GeneratedPath> {
  const { request, idPrefix: prefix, trainings } = input;
  // Starts now and never throws, so it runs alongside the outline and project calls.
  const jobsPromise = jobsLive(llm, input, practice);

  const outline = await llm.json<Outline>({
    tier: "quality",
    system: OUTLINE_SYSTEM,
    content: `Learner request:\n<learner_request>\n${requestBlock(request)}\n</learner_request>`,
    schema: OUTLINE_SCHEMA,
    maxTokens: 8000,
    timeoutMs: PATH_TIMEOUT_MS,
    thinking: "low",
    validate: validateOutline,
  });

  const used = new Set<string>();
  const companies = outline.companies.map((c, n) => buildCompany(prefix, n, c, used));
  const npcs = outline.npcs.map((m, n) => buildNpc(prefix, n, m, companies[n].id));
  const career: Career = {
    id: prefix,
    title: outline.career.title,
    tagline: outline.career.tagline,
    description: outline.career.description,
    skills: outline.career.skills,
    color: outline.career.color,
    generated: true,
  };

  const scenarios = await Promise.all(
    outline.scenarios.map((s, n) =>
      projectWithRetry(llm, { n, prefix, outline: s, career, companies, npcs, request, outlineCareer: outline.career }),
    ),
  );

  const pack: CareerPack = { career, companies, npcs, scenarios };
  const problems = validateCareerPack(pack);
  if (problems.length) throw new Error(`live path invalid: ${problems.slice(0, 3).join("; ")}`);
  const jobs = await jobsPromise;
  const jobProblems = validateJobs(jobs, [career.id]);
  if (jobProblems.length) throw new Error(`jobs invalid: ${jobProblems.slice(0, 2).join("; ")}`);

  const recommended = recommendTrainings(request, trainings, career.skills);
  return {
    pack,
    jobs,
    recommendedTrainingIds: recommended.length ? recommended : practice.recommendedTrainingIds,
    engine: "live",
  };
}
