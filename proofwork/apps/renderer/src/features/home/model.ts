// Pure view-model helpers for the Home screen. Safe to unit test.
import type { Career, Company, Job, Npc, ObjectivePhase, Scenario, ScenarioCard, ScenarioStatus, VisionBoard } from "@pw/shared";
import { getCompany, getNpc, scenarios as contentScenarios } from "@pw/content";

export interface ObjectiveRouteInput {
  id: string;
  phase: ObjectivePhase;
  currentStageId: string | null;
}

/** Where a learner goes for an objective, by its phase. */
export function routeForObjective(obj: ObjectiveRouteInput): string {
  const base = `/objective/${encodeURIComponent(obj.id)}`;
  switch (obj.phase) {
    case "brief":
    case "kickoff":
    case "pou":
      return base;
    case "stages":
      return obj.currentStageId ? `${base}/stage/${encodeURIComponent(obj.currentStageId)}` : base;
    case "complete":
      return `${base}/review`;
    default:
      return base;
  }
}

/** A scenario card from content, for a project the learner has not been offered yet (other careers). */
export function placeholderCard(s: Scenario, company: Company, npc: Npc): ScenarioCard {
  return {
    id: s.id,
    careerId: s.careerId,
    order: s.order,
    title: s.title,
    coverWord: s.coverWord,
    company,
    npc,
    difficulty: s.difficulty,
    estMinutes: s.estMinutes,
    maxXp: s.maxXp,
    stageCount: s.stages.length,
    map: s.map,
    status: "locked",
    objectiveId: null,
    xpEarned: 0,
    timeSpentSec: 0,
    performance: null,
  };
}

/** A generated path shows at most this many decorative authored buildings, so the map is not crowded. */
export const GENERATED_DECORATIVE_LIMIT = 6;

export interface DecorativeOptions {
  /** Authored scenarios to pick from. Defaults to @pw/content. */
  content?: readonly Scenario[];
  /** Upper bound on decorative buildings. Omit for no limit. */
  limit?: number;
}

/**
 * Authored scenarios drawn as dimmed decorative buildings. Only scenarios the learner does not have
 * a card for are used, so a learner's own companies are never duplicated.
 */
export function decorativeCards(apiCards: readonly ScenarioCard[], options: DecorativeOptions = {}): ScenarioCard[] {
  const { content = contentScenarios, limit = Number.POSITIVE_INFINITY } = options;
  const ownIds = new Set(apiCards.map((c) => c.id));
  const out: ScenarioCard[] = [];
  for (const s of content) {
    if (out.length >= limit) break;
    if (ownIds.has(s.id)) continue;
    const company = getCompany(s.companyId);
    const npc = getNpc(s.npcId);
    if (!company || !npc) continue;
    out.push(placeholderCard(s, company, npc));
  }
  return out;
}

/**
 * Every building on the map. The learner's cards from the API come first and carry their status.
 * Authored scenarios the learner does not have follow as decorative, dimmed buildings.
 */
export function mergeScenarioCards(apiCards: readonly ScenarioCard[], options: DecorativeOptions = {}): ScenarioCard[] {
  return [...apiCards, ...decorativeCards(apiCards, options)];
}

/** Decorative limit for a learner's career: generated paths get a short list, authored ones show all. */
export function decorativeLimitFor(career: Pick<Career, "generated"> | null | undefined): number | undefined {
  return career?.generated === true ? GENERATED_DECORATIVE_LIMIT : undefined;
}

/** Title and colour for the career node in the timeline. Falls back while GET /careers is loading. */
export function careerNodeFor(careers: readonly Pick<Career, "id" | "title" | "color">[], careerId: string | null): { title: string; color: string } | null {
  if (!careerId) return null;
  const found = careers.find((c) => c.id === careerId);
  if (found) return { title: found.title, color: found.color };
  return { title: "Career", color: "var(--color-accent)" };
}

/** Cards for one career, in project order. */
export function careerScenarios(cards: readonly ScenarioCard[], careerId: string | null): ScenarioCard[] {
  if (!careerId) return [];
  return cards.filter((c) => c.careerId === careerId).sort((a, b) => a.order - b.order);
}

/** Default selection: the first in-progress project, else the first available one, else the first. */
export function defaultScenarioId(list: readonly ScenarioCard[]): string | null {
  const inProgress = list.find((c) => c.status === "in_progress");
  if (inProgress) return inProgress.id;
  const available = list.find((c) => c.status === "available");
  if (available) return available.id;
  return list[0]?.id ?? null;
}

/** The project before this one in its career, or null for the first project. */
export function previousScenario(all: readonly ScenarioCard[], card: ScenarioCard): ScenarioCard | null {
  return all.find((c) => c.careerId === card.careerId && c.order === card.order - 1) ?? null;
}

/** Moves an index by delta within a list, wrapping around. From -1 (not in list) it starts at the ends. */
export function cycleIndex(index: number, delta: 1 | -1, length: number): number {
  if (length <= 0) return -1;
  if (index < 0) return delta === 1 ? 0 : length - 1;
  return (index + delta + length) % length;
}

export function statusLabel(status: ScenarioStatus): string {
  switch (status) {
    case "locked":
      return "Locked";
    case "available":
      return "Available";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
  }
}

/** "45 min", or "3 hr" / "2.5 hr" from 60 minutes up. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${Number.isInteger(hours) ? hours.toFixed(0) : hours.toFixed(1)} hr`;
}

export function formatDifficulty(d: ScenarioCard["difficulty"]): string {
  return d.charAt(0).toUpperCase() + d.slice(1);
}

/** Relative time for a past ISO timestamp: "just now", "12 min ago", "3 hr ago", "2 days ago". */
export function relativeTime(iso: string, now: number): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const sec = Math.max(0, Math.round((now - then) / 1000));
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const days = Math.round(hr / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export function isJobPortalUnlocked(completedScenarios: number, threshold = 1): boolean {
  return completedScenarios >= threshold;
}

/** Jobs whose minimum level the learner has reached. */
export function eligibleJobCount(jobs: readonly Pick<Job, "minLevel">[], level: number): number {
  return jobs.filter((j) => j.minLevel <= level).length;
}

export const VISION_FIELDS = ["targetRole", "level", "industry", "companyType", "location", "timeline"] as const;
export type VisionTextField = (typeof VISION_FIELDS)[number] | "why";

export const VISION_LABELS: Record<VisionTextField, string> = {
  targetRole: "Target role",
  level: "Level",
  industry: "Industry",
  companyType: "Company type",
  location: "Location",
  timeline: "Timeline",
  why: "Why",
};

/** Editable draft of a vision board. Every field is a string so inputs stay controlled. */
export type VisionDraft = Record<VisionTextField, string>;

export function emptyVisionDraft(): VisionDraft {
  return { targetRole: "", level: "", industry: "", companyType: "", location: "", timeline: "", why: "" };
}

export function draftFromVision(v: VisionBoard | null | undefined): VisionDraft {
  if (!v) return emptyVisionDraft();
  return {
    targetRole: v.targetRole ?? "",
    level: v.level ?? "",
    industry: v.industry ?? "",
    companyType: v.companyType ?? "",
    location: v.location ?? "",
    timeline: v.timeline ?? "",
    why: v.why ?? "",
  };
}

/** Trims every field. Empty optional fields are dropped; the required core fields are kept as strings. */
export function visionPatchFromDraft(d: VisionDraft): Partial<VisionBoard> {
  const t = (s: string) => s.trim();
  const patch: Partial<VisionBoard> = {
    targetRole: t(d.targetRole),
    level: t(d.level),
    industry: t(d.industry),
    companyType: t(d.companyType),
    location: t(d.location),
    timeline: t(d.timeline),
  };
  const why = t(d.why);
  if (why) patch.why = why;
  return patch;
}

export function isVisionDraftDirty(a: VisionDraft, b: VisionDraft): boolean {
  return VISION_FIELDS.some((k) => a[k] !== b[k]) || a.why !== b.why;
}
