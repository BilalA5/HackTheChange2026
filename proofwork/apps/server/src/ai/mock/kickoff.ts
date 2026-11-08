// Mock: kickoff note checks, kickoff Q&A and Proof-of-Understanding judging.
import type { KickoffSegment, Npc, NoteVerdict, PouQuestion, Company } from "@pw/shared";
import { coverage, lowerFirst, pickBest, sentencesOf, shortPhrase, wordCount } from "../text.ts";

export function checkNoteMock(segment: KickoffSegment, text: string): Omit<NoteVerdict, "xp"> {
  const points = segment.rubricPoints;
  const words = wordCount(text);
  const { covered, missing } = coverage(text, points);
  const need = Math.ceil(0.6 * points.length);
  const accepted = words >= 12 && covered.length >= need;

  let feedback: string;
  if (accepted) {
    const praise = covered[0] ? `, including ${topicOf(covered[0], 10).replace(/…$/, "")}` : "";
    feedback = `Solid note: it covers ${covered.length} of ${points.length} key points${praise}.`;
  } else if (words < 12) {
    const more = missing[0] ? ` Next, try ${topicOf(missing[0], 10).replace(/…$/, "")}.` : "";
    feedback = `Add a bit more detail: a note needs a couple of full sentences.${more}`;
  } else {
    const n = missing.length;
    feedback = `Close: ${n} key point${n === 1 ? " is" : "s are"} still missing. Start with ${missing[0] ? topicOf(missing[0], 12).replace(/…$/, "") : "the main outcome"}, then check again.`;
  }
  return { accepted, covered, missing, feedback };
}

/** Turns a rubric point ("Names the 19-hour median…", "Explains that routine tickets…") into a noun phrase for speech. */
const NOT_VERBS = new Set(["sales", "users", "thresholds", "metrics", "analytics", "news", "series", "tickets", "costs", "results", "stakeholders", "teams", "requirements", "risks", "this", "its", "his", "yes", "always", "less", "unless", "does"]);
const DOUBLE_FINAL = new Set(["set", "get", "put", "cut", "run", "stop", "plan", "commit", "admit", "drop", "split", "flag", "map", "tag"]);

/** "makes" → "making", "identifies" → "identifying", "notes" → "noting". Returns null if the word does not look like a verb. */
function gerund(word: string): string | null {
  const w = word.toLowerCase();
  if (w.length < 4 || !w.endsWith("s") || /(ss|us|is|ics)$/.test(w) || NOT_VERBS.has(w)) return null;
  let base: string;
  if (w.endsWith("ies")) base = w.slice(0, -3) + "y";
  else if (/(sh|ch|x|ss|zz|o)es$/.test(w)) base = w.slice(0, -2);
  else base = w.slice(0, -1);
  if (DOUBLE_FINAL.has(base)) return base + base.at(-1) + "ing";
  if (base.endsWith("ie")) return base.slice(0, -2) + "ying";
  if (base.endsWith("e") && !base.endsWith("ee")) return base.slice(0, -1) + "ing";
  return base + "ing";
}

const CLAUSE_VERB = /\b(is|are|was|were|must|should|can|will|has|have|show|shows|reflect|reflects|mean|means|need|needs|stay|stays|come|comes|drive|drives|depend|depends|matter|matters|happen|happens|cause|causes|go|goes)\b/i;

/**
 * Turns a rubric point into a phrase that fits "you covered …" / "think about …":
 * "Makes regressions visible" → "making regressions visible", "Does not drop X" → "not dropping X",
 * "Confidence reflects the evidence" → "the point that confidence reflects the evidence".
 */
export function topicOf(point: string, words = 10): string {
  const t = point.trim().replace(/[.;:!?]+$/, "");
  const parts = t.split(/\s+/);
  let out: string;
  const doesNot = t.match(/^does not\s+(\w+)\s*(.*)$/i);
  if (doesNot) {
    const g = gerund(doesNot[1] + "s") ?? doesNot[1] + "ing";
    out = `not ${g} ${doesNot[2]}`.trim();
  } else if (parts.length > 1 && /^[a-z]/.test(parts[1]) && gerund(parts[0])) {
    out = [gerund(parts[0]), ...parts.slice(1)].join(" ");
  } else if (/^(the|a|an)\s/i.test(t) && CLAUSE_VERB.test(parts.slice(1, 7).join(" "))) {
    out = "the point that " + lowerFirst(t);
  } else if (parts.length >= 4 && CLAUSE_VERB.test(parts.slice(1, 7).join(" "))) {
    out = "the point that " + lowerFirst(t);
  } else if (/^(the|a|an|its|their|your|each|every|both|one|two|three|how|why|what|which|when|where|whether)\b/i.test(t)) {
    out = lowerFirst(t);
  } else {
    out = "the " + lowerFirst(t);
  }
  return shortPhrase(out, words);
}

const FILLER = /^(thanks|thank you|hi|hey|hello|okay|ok|so|alright|right|great|good)\b/i;
const substantive = (s: string) => wordCount(s) >= 6 && !FILLER.test(s.trim());

export function answerKickoffMock(i: { npc: Npc; company: Company; segment: KickoffSegment; question: string }): string {
  const { segment, question } = i;
  const candidates = [
    ...sentencesOf(segment.transcript),
    ...segment.slides.flatMap((s) => [
      s.heading,
      ...s.bullets,
      ...(s.metric ? [`${s.metric.label}: ${s.metric.value}`] : []),
      ...(s.quote ? [s.quote.text] : []),
      ...(s.flow ?? []),
    ]),
  ];
  const best = pickBest(candidates.filter(substantive), question, 2);
  const opener = ["Good question.", "Happy to explain.", "Fair question."][question.length % 3];
  if (best.length === 0) {
    // No keyword overlap: give the most concrete part of the segment (sentences with numbers first).
    const sentences = sentencesOf(segment.transcript).filter(substantive);
    const concrete = sentences.filter((x) => /\d/.test(x));
    const pick = (concrete.length ? concrete : sentences).slice(0, 2).join(" ") || segment.title;
    return `${opener} The way I'd frame it: ${pick} If a specific part is still fuzzy, ask me about that piece.`;
  }
  return `${opener} ${best.join(" ")}`;
}

export function judgePouMock(i: {
  question: PouQuestion;
  transcript: string;
  isFollowUp: boolean;
}): { verdict: "pass" | "partial" | "fail"; reaction: string; covered: string[]; missing: string[] } {
  const { question, transcript, isFollowUp } = i;
  const { covered, missing } = coverage(transcript, question.rubricPoints);
  const words = wordCount(transcript);
  const total = question.rubricPoints.length || 1;
  const ratio = covered.length / total;

  let verdict: "pass" | "partial" | "fail";
  if (ratio >= 0.5 && words >= 15) verdict = "pass";
  else if (covered.length > 0 || words >= 25) verdict = "partial";
  else verdict = "fail";

  const coveredText = covered.slice(0, 2).map((p) => topicOf(p, 8)).join(" and ");
  let reaction: string;
  if (verdict === "pass") {
    reaction = coveredText
      ? `That's the picture I was after: you clearly covered ${coveredText}. Let's keep moving.`
      : "That's a clear answer. Let's keep moving.";
  } else if (verdict === "partial") {
    const lead = isFollowUp ? "Thanks, that helps. " : "You've got part of it. ";
    const coveredPart = coveredText ? `You covered ${coveredText}, ` : "";
    const think = missing[0]
      ? `think about ${topicOf(missing[0], 10)} before we go further.`
      : "tighten the detail before we go further.";
    reaction = `${lead}${coveredPart}so I'd like you to ${think}`;
  } else {
    reaction = isFollowUp
      ? "I still don't hear enough to be confident yet. Try once more, in your own words."
      : "I'm not hearing enough yet to know you've got this. Take a breath and answer again, focusing on the core of the question.";
  }
  return { verdict, reaction, covered, missing };
}
