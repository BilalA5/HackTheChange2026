// Reads the learner's request into a profile: family, industry pack, level, company type, timeline and location.
import type { PathRequest } from "@pw/shared";
import { detectFamily, FAMILIES } from "./families.ts";
import { detectDomain } from "./industries.ts";
import type { CompanyType, Domain, FamilyId, LevelInfo, Profile } from "./types.ts";
import { clean, titleCase, trimWords } from "./util.ts";

/** Maps a free-text level to a ladder index (0 entry .. 4 lead) and a difficulty bucket. */
export function parseLevel(text: string | undefined): LevelInfo {
  const t = (text ?? "").toLowerCase();
  if (/intern|student|entry|graduate|new grad|trainee|apprentice/.test(t)) return { idx: 0, bucket: "junior", word: "Entry-level" };
  if (/junior|\bjr\b|associate/.test(t)) return { idx: 1, bucket: "junior", word: "Junior" };
  if (/\bmid|intermediate|\bii\b/.test(t)) return { idx: 2, bucket: "mid", word: "" };
  if (/senior|\bsr\b/.test(t)) return { idx: 3, bucket: "senior", word: "Senior" };
  if (/lead|principal|staff|manager|director|\bhead\b|chief|\bvp\b|vice president/.test(t)) return { idx: 4, bucket: "senior", word: "Lead" };
  return { idx: 2, bucket: "default", word: "" };
}

export function parseCompanyType(text: string | undefined): CompanyType {
  const t = (text ?? "").toLowerCase();
  if (/non.?profit|charity|\bngo\b|foundation|community/.test(t)) return "nonprofit";
  if (/enterprise|large|corporate|global|fortune|public company/.test(t)) return "enterprise";
  if (/startup|early.stage|seed/.test(t)) return "startup";
  return "scaleup";
}

/** Estimated minutes per scenario from the timeline: about a month is quick, six months or more is deep. */
export function estimateRange(timeline: string | undefined): [number, number] {
  const m = (timeline ?? "").toLowerCase().match(/(\d+)\s*(day|week|month|year)s?/);
  if (!m) return [120, 180];
  const n = Number(m[1]);
  const months = m[2] === "day" ? n / 30 : m[2] === "week" ? n / 4.3 : m[2] === "month" ? n : n * 12;
  if (months <= 1.5) return [90, 130];
  if (months >= 6) return [150, 220];
  return [120, 180];
}

const CANADIAN = /calgary|toronto|vancouver|edmonton|montreal|canad|ottawa|winnipeg|halifax|quebec|alberta|ontario|british columbia/i;

function optional(value: string | undefined, max: number): string | undefined {
  const cleaned = trimWords(value ?? "", max);
  return cleaned ? cleaned : undefined;
}

/** Families whose work usually sits in one industry, used when the learner names no industry. */
const FAMILY_DOMAIN: Partial<Record<FamilyId, string>> = {
  software: "software",
  ai_ml: "software",
  healthcare: "healthcare",
  energy_eng: "energy",
};

/**
 * The industry pack: what the learner typed wins. With no industry, the role itself is read
 * ("Teacher" -> education, "Game Designer" -> gaming), then the role family's usual industry.
 */
export function pickDomain(industry: string | undefined, role: string, familyId: FamilyId): Domain {
  const typed = detectDomain(industry);
  if (typed.id !== "generic" || clean(industry)) return typed;
  const fromRole = detectDomain(role);
  if (fromRole.id !== "generic" && fromRole.id !== "saas") return fromRole;
  const fallback = FAMILY_DOMAIN[familyId];
  return fallback ? detectDomain(fallback) : typed;
}

export function buildProfile(request: PathRequest): Profile {
  const role = titleCase(request.targetRole.trim() || "Professional");
  const familyId = detectFamily(role);
  const family = FAMILIES[familyId];
  const domain = pickDomain(request.industry, role, familyId);
  const industryText = clean(request.industry);
  const location = clean(request.location) || undefined;
  return {
    request,
    role,
    roleLower: role.toLowerCase(),
    family,
    domain,
    industry: industryText ? trimWords(industryText, 6) : domain.label,
    level: parseLevel(request.level),
    companyType: parseCompanyType(request.companyType),
    location,
    locationShort: location && !/^remote$/i.test(location) ? location.split(",")[0].trim() : undefined,
    canadian: location ? CANADIAN.test(location) : false,
    estMinutes: estimateRange(request.timeline),
    why: optional(request.why, 14),
    background: optional(request.background, 14),
  };
}
