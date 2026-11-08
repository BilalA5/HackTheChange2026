// Live: rubric grading for submissions (quality tier) and final presentations (quality tier).
import type { Evaluation, Objective, PresentationInput, Rubric, RubricAxis, RubricLevel, Scenario, Stage, Submission } from "@pw/shared";
import { RUBRIC_AXES } from "@pw/shared";
import type { GradeResult } from "../../contracts.ts";
import type { LlmClient } from "../llm.ts";
import { clip, obj, oneOf, str, strArr, STRING_ARRAY } from "./common.ts";
import { overallOf } from "../mock/grade.ts";

const LEVELS = ["below", "meeting", "exceeding"] as const;

const GRADER_SYSTEM = `
You are a calibrated assessor for a job simulation. Grade the learner's work on four axes:
- understanding: did they grasp the problem and the agreed plan? Judge the notes and plan evidence.
- quality: does the work meet the agreed requirements? Look for concrete evidence, links and results.
- communication: did they ask good questions and explain their work clearly?
- independence: did they finish with limited help (few learn chats, no stalling)?

Levels: "below", "meeting", "exceeding". "meeting" is the norm for a competent, complete attempt.
"exceeding" is rare: only for clear, above-expectation evidence. "below" needs concrete gaps.
Every rationale is ONE sentence that cites specific evidence from the material (a requirement, a note, a count).
Never grade the learner on spelling or style alone. Overall is the majority level across the four axes.
Give 2 to 3 strengths and 2 to 3 improvements. Each improvement must be specific and actionable.
summary is exactly 2 sentences.
`.trim();

const AXIS_SCHEMA = {
  type: "object",
  properties: {
    level: { type: "string", enum: LEVELS },
    rationale: { type: "string" },
  },
  required: ["level", "rationale"],
  additionalProperties: false,
};

const GRADE_SCHEMA = {
  type: "object",
  properties: {
    understanding: AXIS_SCHEMA,
    quality: AXIS_SCHEMA,
    communication: AXIS_SCHEMA,
    independence: AXIS_SCHEMA,
    overall: { type: "string", enum: LEVELS },
    summary: { type: "string" },
    strengths: STRING_ARRAY,
    improvements: STRING_ARRAY,
  },
  required: ["understanding", "quality", "communication", "independence", "overall", "summary", "strengths", "improvements"],
  additionalProperties: false,
};

function validateGrade(raw: unknown, fallbackOverall: (levels: RubricLevel[]) => RubricLevel): GradeResult {
  const v = obj(raw, "grade");
  const rubric = {} as Rubric;
  for (const axis of RUBRIC_AXES) {
    const a = obj(v[axis], axis);
    rubric[axis] = {
      level: oneOf(a.level, LEVELS, `${axis} level`),
      rationale: str(a.rationale, `${axis} rationale`, 400),
    };
  }
  // Overall is always the majority rule over the four axes, so the model's own overall is only checked for shape.
  oneOf(v.overall, LEVELS, "overall");
  const overall = fallbackOverall(RUBRIC_AXES.map((a) => rubric[a].level));
  return {
    rubric,
    overall,
    summary: str(v.summary, "summary", 800),
    strengths: strArr(v.strengths, "strengths", 3).filter(Boolean).slice(0, 3),
    improvements: strArr(v.improvements, "improvements", 3).filter(Boolean).slice(0, 3),
    passed: overall !== "below",
  };
}

export async function gradeSubmissionLive(
  llm: LlmClient,
  i: {
    scenario: Scenario;
    stage: Stage;
    submissions: Submission[];
    fileTexts: Record<string, string>;
    notes: Objective["notes"];
    signals: { planComplete: boolean; agreedRequirements: string[]; learnItemsCompleted: number; learnChats: number; managerQuestions: number; minutesSpent: number };
  },
): Promise<GradeResult> {
  const subs = i.submissions.map((s) => `- [${s.kind}] ${s.fileName ? `${s.fileName}: ` : ""}${clip(s.value, 3000)}`).join("\n");
  const files = Object.entries(i.fileTexts)
    .map(([name, body]) => `--- file ${name} ---\n${clip(body, 3000)}`)
    .join("\n");
  const notes = Object.entries(i.notes)
    .map(([k, v]) => `${k}: ${clip(v || "(empty)", 800)}`)
    .join("\n");
  const requirements = i.signals.agreedRequirements.length ? i.signals.agreedRequirements : i.stage.requirements;
  const content = [
    `Project: ${i.scenario.title}. Deliverables: ${i.scenario.deliverables.map((d) => d.title).join("; ")}.`,
    `Stage: ${i.stage.title}. ${i.stage.summary}`,
    `Agreed requirements:\n${requirements.map((r, n) => `${n + 1}. ${r}`).join("\n")}`,
    `Rubric hints for meeting expectations:\n${RUBRIC_AXES.map((a: RubricAxis) => `- ${a}: ${i.stage.rubricHints[a]}`).join("\n")}`,
    `Submissions:\n${subs || "(none)"}`,
    files ? `Extracted file text:\n${files}` : "",
    `Kickoff notes:\n${notes}`,
    `Signals: plan agreed=${i.signals.planComplete}; learn chats=${i.signals.learnChats}; learn items completed=${i.signals.learnItemsCompleted}; manager questions=${i.signals.managerQuestions}; minutes spent=${Math.round(i.signals.minutesSpent)}.`,
  ]
    .filter(Boolean)
    .join("\n\n");
  return llm.json({
    tier: "quality",
    system: GRADER_SYSTEM,
    content,
    schema: GRADE_SCHEMA,
    maxTokens: 2000,
    validate: (raw) => validateGrade(raw, overallOf),
  });
}

export async function gradePresentationLive(
  llm: LlmClient,
  i: { scenario: Scenario; stage: Stage; input: PresentationInput; priorEvaluations: Evaluation[] },
): Promise<GradeResult> {
  const priors = i.priorEvaluations.slice(-5).map((e) => `- ${e.overall}: ${e.summary}`).join("\n");
  const content = [
    `Project: ${i.scenario.title}. Deliverables: ${i.scenario.deliverables.map((d) => `${d.title} (${d.description})`).join("; ")}.`,
    `Stage: ${i.stage.title}. Requirements: ${i.stage.requirements.join("; ")}.`,
    `Presentation: ${Math.round(i.input.durationSec)} seconds; framing ${Math.round(i.input.framingScore * 100)}% of the time; ${i.input.slidesCovered} slides covered.`,
    `Transcript:\n<transcript>\n${clip(i.input.transcript, 12000)}\n</transcript>`,
    priors ? `Earlier evaluations:\n${priors}` : "No earlier evaluations.",
    `Grade communication from pacing, framing and clarity. Grade understanding from how well the talk covers the deliverables and requirements.`,
  ].join("\n\n");
  return llm.json({
    tier: "quality",
    system: `${GRADER_SYSTEM}\nYou are grading the learner's final presentation for the stage "${i.stage.title}".`,
    content,
    schema: GRADE_SCHEMA,
    maxTokens: 2000,
    validate: (raw) => validateGrade(raw, overallOf),
  });
}
