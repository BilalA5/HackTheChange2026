// Recommends trainings from the authored library: keyword overlap with the role, industry and skills.
import type { PathRequest, Training, TrainingKind } from "@pw/shared";
import { detectFamily, FAMILIES } from "./families.ts";

const KINDS: TrainingKind[] = ["skill", "mindset", "communication"];
const MIN_PICK = 3;
const MAX_PICK = 6;
const STOP = new Set(["with", "your", "from", "that", "this", "work", "team", "role", "into", "more", "have", "will", "about"]);

/** Lowercase words of four or more letters, minus a few filler words. */
function words(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z0-9+]{3,}/g) ?? []).filter((w) => !STOP.has(w));
}

/**
 * Returns 3 to 6 training ids (never more than 8). The best match of each kind comes first, so the
 * list mixes skill, mindset and communication where the library allows.
 */
export function recommendTrainings(request: PathRequest, trainings: Training[], skills: string[] = []): string[] {
  if (trainings.length === 0) return [];
  const family = FAMILIES[detectFamily(request.targetRole)];
  const query = new Set(
    words(`${request.targetRole} ${request.industry ?? ""} ${request.why ?? ""} ${skills.join(" ")} ${family.skills.join(" ")}`),
  );
  const scored = trainings
    .map((t) => {
      const haystack = new Set(words(`${t.title} ${t.summary} ${t.tags.join(" ")}`));
      let score = 0;
      for (const w of query) if (haystack.has(w)) score++;
      return { t, score };
    })
    .sort((a, b) => b.score - a.score || a.t.id.localeCompare(b.t.id));

  const target = Math.min(MAX_PICK, Math.max(MIN_PICK, trainings.length));
  const chosen: string[] = [];
  for (const kind of KINDS) {
    const best = scored.find((s) => s.t.kind === kind && !chosen.includes(s.t.id));
    if (best && chosen.length < target) chosen.push(best.t.id);
  }
  for (const s of scored) {
    if (chosen.length >= target) break;
    if (!chosen.includes(s.t.id)) chosen.push(s.t.id);
  }
  return chosen.slice(0, 8);
}
