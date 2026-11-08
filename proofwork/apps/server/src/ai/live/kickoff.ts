// Live: kickoff note checks, kickoff Q&A and Proof-of-Understanding judging.
import type { Company, KickoffSegment, Npc, NoteVerdict, PouQuestion, Scenario } from "@pw/shared";
import type { ModelTier } from "../../contracts.ts";
import type { Llm } from "../llm.ts";
import { wordCount } from "../text.ts";
import { STRING_ARRAY, clip, obj, oneOf, personaBlock, str, strArr, subsetOf } from "./common.ts";

const NOTE_CHECK_SYSTEM = `
You check a new hire's kickoff note. The note is for one section of the project brief (problem, outcome or process).
Each rubric point is covered when the note shows the learner understood that idea, in their own words.
Judge UNDERSTANDING, not wording or spelling. Synonyms and paraphrases count.
Accept when the note has at least 12 words and covers at least 60% of the rubric points. Otherwise reject.
"covered" and "missing" must each use the rubric points verbatim.
"feedback" is 1 or 2 friendly sentences from the manager. Name what is missing when rejected, and praise a specific thing when accepted.
Be calibrated: a short but accurate note can pass. Do not reward length for its own sake.
`.trim();

const NOTE_SCHEMA = {
  type: "object",
  properties: {
    accepted: { type: "boolean" },
    covered: STRING_ARRAY,
    missing: STRING_ARRAY,
    feedback: { type: "string" },
  },
  required: ["accepted", "covered", "missing", "feedback"],
  additionalProperties: false,
};

export async function checkNoteLive(
  llm: Llm,
  i: { scenario: Scenario; segment: KickoffSegment; text: string; tier?: ModelTier },
): Promise<Omit<NoteVerdict, "xp">> {
  const points = i.segment.rubricPoints;
  const words = wordCount(i.text);
  return llm.json({
    tier: i.tier ?? "fast",
    system: NOTE_CHECK_SYSTEM,
    content: [
      `Brief section: ${i.segment.title} (${i.segment.noteSection}).`,
      `Rubric points:\n${points.map((p, n) => `${n + 1}. ${p}`).join("\n")}`,
      `Learner note (${words} words):\n<note>\n${clip(i.text, 3000)}\n</note>`,
    ].join("\n\n"),
    schema: NOTE_SCHEMA,
    maxTokens: 800,
    validate: (raw) => {
      const v = obj(raw, "note verdict");
      const covered = subsetOf(strArr(v.covered, "covered"), points);
      const missing = subsetOf(strArr(v.missing, "missing"), points);
      const accepted = typeof v.accepted === "boolean" ? v.accepted && words >= 12 : false;
      return { accepted, covered, missing, feedback: str(v.feedback, "feedback", 600) };
    },
  });
}

const KICKOFF_QA_SYSTEM = (npc: Npc, company: Company, scenario: Scenario) =>
  `
${personaBlock(npc, scenario, company)}
The learner is asking you a question during the kickoff meeting. Answer in 2 to 4 sentences, in your own voice.
Use only the transcript and slides provided. If the material does not cover the question, say so briefly and point to the closest part.
Do not invent figures, names or commitments.
`.trim();

export async function answerKickoffLive(
  llm: Llm,
  i: { scenario: Scenario; npc: Npc; company: Company; segment: KickoffSegment; question: string },
): Promise<string> {
  const slides = i.segment.slides
    .map((s) => [s.heading, ...s.bullets, s.metric ? `${s.metric.label}: ${s.metric.value}` : "", s.quote ? `"${s.quote.text}"` : ""].filter(Boolean).join(" | "))
    .join("\n");
  const text = await llm.complete({
    tier: "fast",
    system: KICKOFF_QA_SYSTEM(i.npc, i.company, i.scenario),
    content: `Section: ${i.segment.title}\nTranscript you said:\n${i.segment.transcript}\nSlides on screen:\n${slides}\n\nLearner question: ${clip(i.question, 500)}`,
    maxTokens: 500,
  });
  return text.trim();
}

const POU_SYSTEM = (npc: Npc, scenario: Scenario) =>
  `
${personaBlock(npc, scenario)}
You are judging a spoken Proof of Understanding answer. Judge whether the learner UNDERSTANDS the idea, not their wording.
Verdicts:
- "pass": the answer covers at least half the rubric points with real reasoning.
- "partial": some correct understanding, but important points are missing or shallow.
- "fail": little or no relevant understanding, or off topic.
"covered" and "missing" use the rubric points verbatim.
"reaction" is 1 or 2 sentences spoken by you, the manager, in character. Acknowledge the specific points the learner covered.
If partial, say what to think about, but do NOT ask a follow-up question and do NOT quote any follow-up.
Be calibrated and evidence-based.
`.trim();

const POU_SCHEMA = {
  type: "object",
  properties: {
    verdict: { type: "string", enum: ["pass", "partial", "fail"] },
    reaction: { type: "string" },
    covered: STRING_ARRAY,
    missing: STRING_ARRAY,
  },
  required: ["verdict", "reaction", "covered", "missing"],
  additionalProperties: false,
};

export async function judgePouLive(
  llm: Llm,
  i: { scenario: Scenario; npc: Npc; question: PouQuestion; transcript: string; isFollowUp: boolean },
): Promise<{ verdict: "pass" | "partial" | "fail"; reaction: string; covered: string[]; missing: string[] }> {
  const points = i.question.rubricPoints;
  return llm.json({
    tier: "fast",
    system: POU_SYSTEM(i.npc, i.scenario),
    content: [
      `Question you asked: ${i.question.prompt}`,
      `Rubric points:\n${points.map((p, n) => `${n + 1}. ${p}`).join("\n")}`,
      `This is ${i.isFollowUp ? "a follow-up answer" : "the first answer"}.`,
      `Learner's spoken answer (transcript):\n<answer>\n${clip(i.transcript, 4000)}\n</answer>`,
    ].join("\n\n"),
    schema: POU_SCHEMA,
    maxTokens: 600,
    validate: (raw) => {
      const v = obj(raw, "pou verdict");
      return {
        verdict: oneOf(v.verdict, ["pass", "partial", "fail"] as const, "verdict"),
        reaction: str(v.reaction, "reaction", 500),
        covered: subsetOf(strArr(v.covered, "covered"), points),
        missing: subsetOf(strArr(v.missing, "missing"), points),
      };
    },
  });
}
