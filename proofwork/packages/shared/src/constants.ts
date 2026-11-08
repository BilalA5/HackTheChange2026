// Product-wide constants. Every package imports these instead of hard-coding values.

export const APP_NAME = "Proofwork";
export const APP_ID = "com.proofwork.desktop";
/** Custom URL scheme for deep links, e.g. proofwork://auth/callback?token=...&state=... */
export const PROTOCOL_SCHEME = "proofwork";

export const DEFAULT_SERVER_PORT = 8787;
export const DEFAULT_SERVER_URL = `http://127.0.0.1:${DEFAULT_SERVER_PORT}`;
/** REST base = `${serverUrl}${API_PREFIX}` */
export const API_PREFIX = "/api";
/** WebSocket paths (relative to the server origin, ws:// scheme). */
export const WS_PATHS = {
  cowork: "/ws/cowork",
  notifications: "/ws/notifications",
} as const;

/** The packaged renderer is served from 127.0.0.1 on a fixed port per release channel. Dev uses Vite. */
export const RENDERER_PORTS = { production: 31470, staging: 31490, dev: 5173 } as const;
export type ReleaseChannel = keyof typeof RENDERER_PORTS;

/** Cumulative XP needed to reach each level (index = level). Level 0 starts at 0 XP. */
export const LEVEL_THRESHOLDS = [0, 750, 2000, 4000, 6500, 9500, 13000, 17000, 21500, 27000, 33000] as const;
export const MAX_LEVEL = LEVEL_THRESHOLDS.length - 1;

export interface LevelInfo {
  level: number;
  /** Threshold of the current level. */
  floor: number;
  /** Threshold of the next level, or null at max level. */
  nextThreshold: number | null;
  xpIntoLevel: number;
  xpToNext: number;
  /** 0..1 progress towards the next level (1 at max). */
  ratio: number;
}

export function levelForXp(xp: number): LevelInfo {
  let level = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) if (xp >= LEVEL_THRESHOLDS[i]) level = i;
  const floor = LEVEL_THRESHOLDS[level];
  const nextThreshold = level < MAX_LEVEL ? LEVEL_THRESHOLDS[level + 1] : null;
  const xpIntoLevel = xp - floor;
  const xpToNext = nextThreshold === null ? 0 : nextThreshold - xp;
  const ratio = nextThreshold === null ? 1 : xpIntoLevel / (nextThreshold - floor);
  return { level, floor, nextThreshold, xpIntoLevel, xpToNext, ratio };
}

export type PlanId = "free" | "pro" | "unlimited";
export interface PlanInfo {
  id: PlanId;
  name: string;
  priceUsdMonthly: number;
  /** Credits granted: once for free, per month for pro, null = fair-use unlimited. */
  credits: number | null;
  oneTime: boolean;
  features: string[];
}
export const PLANS: PlanInfo[] = [
  {
    id: "free",
    name: "Starter",
    priceUsdMonthly: 0,
    credits: 10_000,
    oneTime: true,
    features: ["10,000 credits once (expire after 30 days)", "AI co-worker (text)", "Evaluations and feedback"],
  },
  {
    id: "pro",
    name: "Pro",
    priceUsdMonthly: 99,
    credits: 20_000,
    oneTime: false,
    features: ["20,000 credits every month, unused credits roll over", "Voice + screen co-working", "Personalised trainings"],
  },
  {
    id: "unlimited",
    name: "Unlimited",
    priceUsdMonthly: 199,
    credits: null,
    oneTime: false,
    features: ["Fair-use unlimited credits", "Priority voice", "Everything in Pro"],
  },
];

/** User-visible ledger categories (Usage tab). */
export type CreditCategory = "evaluation" | "training" | "ai_manager" | "coaching" | "other";
export const CREDIT_CATEGORIES: CreditCategory[] = ["evaluation", "training", "ai_manager", "coaching", "other"];

/** Credits debited server-side per AI action. */
export const CREDIT_COSTS = {
  note_check: { amount: 8, category: "evaluation" },
  kickoff_question: { amount: 6, category: "ai_manager" },
  pou_turn: { amount: 15, category: "evaluation" },
  plan_turn: { amount: 6, category: "ai_manager" },
  learn_chat: { amount: 5, category: "training" },
  training_lesson: { amount: 3, category: "training" },
  submission_eval: { amount: 40, category: "evaluation" },
  presentation_eval: { amount: 40, category: "evaluation" },
  cowork_turn: { amount: 10, category: "ai_manager" },
  coach_chat: { amount: 8, category: "coaching" },
  application_draft: { amount: 12, category: "other" },
  /** Regenerating a personal path from Settings (the first one, during onboarding, is free). */
  path_generation: { amount: 60, category: "other" },
} as const satisfies Record<string, { amount: number; category: CreditCategory }>;
export type CreditAction = keyof typeof CREDIT_COSTS;

export const RUBRIC_AXES = ["understanding", "quality", "communication", "independence"] as const;
export type RubricAxis = (typeof RUBRIC_AXES)[number];
export const RUBRIC_LEVELS = ["below", "meeting", "exceeding"] as const;
export type RubricLevel = (typeof RUBRIC_LEVELS)[number];
export const RUBRIC_LEVEL_LABEL: Record<RubricLevel, string> = {
  below: "Below Expectations",
  meeting: "Meeting Expectations",
  exceeding: "Exceeding Expectations",
};
export const RUBRIC_AXIS_LABEL: Record<RubricAxis, string> = {
  understanding: "Understanding",
  quality: "Quality",
  communication: "Communication",
  independence: "Independence",
};

/** careerId used in onboarding for "the path generated from my answers" before it exists. */
export const CUSTOM_CAREER_ID = "custom";

/** XP for accepted kickoff notes per section. Held until the Proof of Understanding is passed. */
export const NOTE_XP = { problem: 100, outcome: 200, process: 100 } as const;
export const POU_PASS_XP = 150;
/** Multiplier of stage.xp by overall rubric outcome. */
export const EVAL_XP_RATIO: Record<RubricLevel, number> = { below: 0.4, meeting: 0.8, exceeding: 1 };
/** Job portal unlocks after this many completed scenarios. */
export const JOB_PORTAL_UNLOCK_SCENARIOS = 1;

/** Renderer surfaces. Every window loads the same index.html with ?surface=<name>. */
export const SURFACES = ["main", "pip", "hud", "island", "cowork", "recordbar", "camera", "region"] as const;
export type Surface = (typeof SURFACES)[number];
/** Overlay windows the main process can open (every surface except "main"). */
export type OverlayKind = Exclude<Surface, "main">;

export const NOTIFICATION_CATEGORIES = ["progress", "feedback", "manager", "coaching", "jobs", "billing", "product"] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

/** Bug reporter feature taxonomy (doubles as the product's table of contents). */
export const FEATURE_TAXONOMY = [
  "Onboarding",
  "Login & account",
  "World map & timeline",
  "Kickoff meeting",
  "Proof of understanding",
  "Plan mode",
  "Do mode / co-worker",
  "Learn mode & trainings",
  "Presentation",
  "Evaluation & feedback",
  "Portfolio & job portal",
  "Credits & usage",
  "Notifications",
  "Settings",
  "App shell (windows, PiP, updates)",
  "Content",
] as const;
