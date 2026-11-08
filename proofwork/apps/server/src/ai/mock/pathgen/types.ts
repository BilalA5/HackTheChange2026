// Internal types for the practice-mode generator. Public output types come from @pw/shared.
import type { PathRequest, SubmissionKind } from "@pw/shared";
import type { Rng } from "./rng.ts";

export type FamilyId =
  | "software"
  | "ai_ml"
  | "data"
  | "product"
  | "design"
  | "marketing"
  | "sales_cs"
  | "operations"
  | "finance"
  | "people"
  | "healthcare"
  | "energy_eng"
  | "generic";

export type Archetype = "diagnose" | "build" | "launch";
export type LevelBucket = "junior" | "mid" | "senior" | "default";
export type CompanyType = "startup" | "scaleup" | "enterprise" | "nonprofit";

export interface MetricSpec {
  name: string;
  /** Which direction is good. */
  better: "lower" | "higher";
  /** Range for the goal value; the current value is worse than the goal. */
  goal: [number, number];
  fmt: (n: number) => string;
}

/** Vocabulary for one role family. */
export interface Family {
  id: FamilyId;
  /** Lowercase noun phrase used in copy, e.g. "software engineering". */
  label: string;
  color: string;
  /** 5-7 real tools. */
  tools: string[];
  /** 3-4 workflow steps. */
  workflows: string[];
  /** 6-8 skills. */
  skills: string[];
  metrics: MetricSpec[];
  artifacts: { build: string; analyze: string; memo: string };
  systemNouns: string[];
  teams: string[];
  constraints: string[];
  stakeholders: string[];
  /** Four slices of the customer base, used in charts. */
  segments: string[];
  /** Manager titles, indexed by the learner's level (0 entry .. 4 lead). Managers sit one level above. */
  managerTitles: string[];
  kinds: SubmissionKind[];
  /** Mid-level base pay in thousands of USD. */
  pay: number;
}

/** Vocabulary for one industry. */
export interface Domain {
  id: string;
  label: string;
  match: RegExp;
  customers: string;
  customer: string;
  products: string[];
  /** Plural nouns for the volume of work, e.g. "orders". */
  items: string[];
  volume: [number, number];
  /** Noun phrases describing a business problem. */
  problems: string[];
  /** Exactly three plausible causes, lowercase noun phrases. */
  causes: string[];
  metrics: MetricSpec[];
  suffixes: string[];
  /** Verb phrase, e.g. "sells everyday goods online". */
  offer: string;
  /** Full sentence without a final stop, e.g. "A shopper counts as active after an order in 90 days". */
  definition: string;
  /** Clause, e.g. "gift card purchases are mixed into order counts". */
  caveat: string;
}

export interface LevelInfo {
  idx: number;
  bucket: LevelBucket;
  /** "Junior", "Senior", "Lead", "Entry-level" or "" for mid. */
  word: string;
}

export interface Profile {
  request: PathRequest;
  role: string;
  roleLower: string;
  family: Family;
  domain: Domain;
  /** Learner's industry as typed (cleaned), or the domain label. */
  industry: string;
  level: LevelInfo;
  companyType: CompanyType;
  location: string | undefined;
  locationShort: string | undefined;
  canadian: boolean;
  estMinutes: [number, number];
  why: string | undefined;
  background: string | undefined;
}

export interface GenCtx {
  rng: Rng;
  idPrefix: string;
  prof: Profile;
}
