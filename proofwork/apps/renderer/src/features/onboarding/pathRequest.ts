// The "Build a new path" form in Settings: draft state, prefill from the vision board, and the request body.
import type { PathRequest, VisionBoard } from "@pw/shared";
import { boardText } from "./board";

export interface PathDraft {
  targetRole: string;
  level: string;
  industry: string;
  companyType: string;
  location: string;
  timeline: string;
  why: string;
  background: string;
}

export const PATH_DRAFT_KEYS: readonly (keyof PathDraft)[] = [
  "targetRole",
  "level",
  "industry",
  "companyType",
  "location",
  "timeline",
  "why",
  "background",
];

export function emptyPathDraft(): PathDraft {
  return { targetRole: "", level: "", industry: "", companyType: "", location: "", timeline: "", why: "", background: "" };
}

/** Prefills the form from the learner's vision board. Missing fields stay empty. */
export function pathDraftFromVision(v: Partial<VisionBoard> | null | undefined): PathDraft {
  if (!v) return emptyPathDraft();
  return {
    targetRole: boardText(v.targetRole),
    level: boardText(v.level),
    industry: boardText(v.industry),
    companyType: boardText(v.companyType),
    location: boardText(v.location),
    timeline: boardText(v.timeline),
    why: boardText(v.why),
    background: boardText(v.background),
  };
}

/**
 * The request body for POST /me/path. Null when the target role is blank (the only required field).
 * Optional fields that are blank are left out.
 */
export function pathRequestFromDraft(d: PathDraft): PathRequest | null {
  const targetRole = d.targetRole.trim();
  if (targetRole.length === 0) return null;
  const req: PathRequest = { targetRole };
  const optional: [Exclude<keyof PathRequest, "targetRole">, string][] = [
    ["level", d.level],
    ["industry", d.industry],
    ["companyType", d.companyType],
    ["location", d.location],
    ["timeline", d.timeline],
    ["why", d.why],
    ["background", d.background],
  ];
  for (const [key, value] of optional) {
    const t = value.trim();
    if (t.length > 0) req[key] = t;
  }
  return req;
}
