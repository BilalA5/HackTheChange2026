// Mock: rubric grading for submissions and presentations. Signals only, no model calls.
import type { Evaluation, Objective, PresentationInput, Rubric, RubricLevel, Scenario, Stage, Submission } from "@pw/shared";
import { RUBRIC_AXES, RUBRIC_AXIS_LABEL } from "@pw/shared";
import type { GradeResult } from "../../contracts.ts";
import { coverage, lowerFirst, plural, sentencesOf, shortPhrase, wordCount } from "../text.ts";

const RANK: Record<RubricLevel, number> = { below: 0, meeting: 1, exceeding: 2 };
const LINK = /https?:\/\/|github\.com/i;

/** Majority of four axes (3 or more); otherwise meeting. */
export function overallOf(levels: RubricLevel[]): RubricLevel {
  for (const l of ["exceeding", "meeting", "below"] as const) {
    if (levels.filter((x) => x === l).length >= 3) return l;
  }
  return "meeting";
}

function finish(
  stage: Stage,
  scenarioTitle: string,
  rubric: Rubric,
): GradeResult {
  const levels = RUBRIC_AXES.map((a) => rubric[a].level);
  const overall = overallOf(levels);
  const byRankDesc = [...RUBRIC_AXES].sort((a, b) => RANK[rubric[b].level] - RANK[rubric[a].level]);
  const top = byRankDesc[0];
  const low = byRankDesc[byRankDesc.length - 1];
  const verdict = overall === "exceeding" ? "exceeded" : overall === "meeting" ? "met" : "did not yet meet";

  const summary =
    `Overall, you ${verdict} expectations on "${scenarioTitle}". ` +
    (RANK[rubric[top].level] > RANK[rubric[low].level]
      ? `${RUBRIC_AXIS_LABEL[top]} was your strongest axis and ${lowerFirst(RUBRIC_AXIS_LABEL[low])} needs the most attention next.`
      : "Your work was consistent across all four axes.");

  const strongAxes = byRankDesc.filter((a) => RANK[rubric[a].level] >= 1);
  const strengthAxes = (strongAxes.length >= 2 ? strongAxes : byRankDesc).slice(0, 3);
  const strengths = strengthAxes.map((a) => rubric[a].rationale);

  const weakAxes = [...RUBRIC_AXES].filter((a) => RANK[rubric[a].level] < 2).sort((a, b) => RANK[rubric[a].level] - RANK[rubric[b].level]);
  const improveAxes = (weakAxes.length >= 2 ? weakAxes : [...RUBRIC_AXES].sort((a, b) => RANK[rubric[a].level] - RANK[rubric[b].level])).slice(0, 3);
  const improvements = improveAxes.map((a) => `${RUBRIC_AXIS_LABEL[a]}: ${stage.rubricHints[a]}`);

  return { rubric, overall, summary, strengths, improvements, passed: overall !== "below" };
}

export function gradeSubmissionMock(i: {
  scenario: Scenario;
  stage: Stage;
  submissions: Submission[];
  fileTexts: Record<string, string>;
  notes: Objective["notes"];
  signals: { planComplete: boolean; agreedRequirements: string[]; learnItemsCompleted: number; learnChats: number; managerQuestions: number; minutesSpent: number };
}): GradeResult {
  const reqs = i.signals.agreedRequirements.length ? i.signals.agreedRequirements : i.stage.requirements;
  const corpus = [...i.submissions.map((s) => s.value), ...Object.values(i.fileTexts)].join("\n");
  const hasWork = i.submissions.length > 0 && corpus.trim().length > 0;
  const link = i.submissions.some((s) => s.kind === "url" || s.kind === "github" || LINK.test(s.value));

  // Understanding: plan agreed plus notes that touch the requirements.
  const notesCov = coverage(Object.values(i.notes).join("\n"), reqs);
  const notesRatio = reqs.length ? notesCov.covered.length / reqs.length : 0;
  const uScore = (i.signals.planComplete ? 0.5 : 0) + 0.5 * notesRatio;
  const uLevel: RubricLevel = uScore >= 0.95 ? "exceeding" : uScore >= 0.5 ? "meeting" : "below";

  // Quality: requirement coverage across the submitted work, plus a link to it.
  const reqCov = coverage(corpus, reqs);
  const ratio = reqs.length ? reqCov.covered.length / reqs.length : hasWork ? 1 : 0;
  const qLevel: RubricLevel = !hasWork ? "below" : ratio >= 0.9 && link ? "exceeding" : ratio >= 0.5 ? "meeting" : "below";

  // Communication: manager questions asked and clarity of written text.
  const textSubs = i.submissions.filter((s) => s.kind === "text").map((s) => s.value).join(" ");
  const tWords = wordCount(textSubs);
  const sents = sentencesOf(textSubs);
  const avgLen = sents.length ? tWords / sents.length : 0;
  const clear = tWords >= 40 && avgLen >= 8 && avgLen <= 28;
  const mq = i.signals.managerQuestions;
  const cScore = (mq >= 1 ? 1 : 0) + (clear ? 1 : 0);
  const cLevel: RubricLevel = cScore === 0 ? "below" : cScore === 2 && mq >= 3 && tWords >= 150 ? "exceeding" : "meeting";

  // Independence: finished the stage with few learn chats.
  const iLevel: RubricLevel = !hasWork ? "below" : i.signals.learnChats === 0 && i.signals.planComplete ? "exceeding" : "meeting";

  const rubric: Rubric = {
    understanding: {
      level: uLevel,
      rationale: i.signals.planComplete
        ? `You agreed the scope in Plan mode and your notes touched ${notesCov.covered.length} of ${reqs.length} requirements.`
        :`You did not agree a plan in Plan mode, and your notes touched ${notesCov.covered.length} of ${reqs.length} requirements.`,
    },
    quality: {
      level: qLevel,
      rationale: hasWork
        ? `Your submission addressed ${reqCov.covered.length} of ${reqs.length} agreed requirements${link ? " and linked to the work itself" : ", with no link to the work itself"}${
            reqCov.missing[0] ? `; ${lowerFirst(shortPhrase(reqCov.missing[0], 6))} wasn't clearly covered` : ""
          }.`
        : "There was no submitted work to assess against the requirements.",
    },
    communication: {
      level: cLevel,
      rationale: `You asked the manager ${plural(mq, "question")} and your written explanation ran ${tWords} words${clear ? " with clear sentences" : ""}.`,
    },
    independence: {
      level: iLevel,
      rationale: `You used ${plural(i.signals.learnChats, "learn chat")} and ${hasWork ? "submitted the stage" : "did not submit the stage yet"}.`,
    },
  };
  return finish(i.stage, i.scenario.title, rubric);
}

export function gradePresentationMock(i: {
  scenario: Scenario;
  stage: Stage;
  input: PresentationInput;
  priorEvaluations: Evaluation[];
}): GradeResult {
  const { input } = i;
  const dur = input.durationSec;
  const durOk = dur >= 120 && dur <= 480;
  const framingOk = input.framingScore >= 0.6;
  const words = wordCount(input.transcript);
  const wpm = dur > 0 ? words / (dur / 60) : 0;
  const pace = wpm >= 110 && wpm <= 170;
  const points = [...i.scenario.deliverables.map((d) => d.title), ...i.stage.requirements];
  const { covered, missing } = coverage(input.transcript, points);
  const cRatio = points.length ? covered.length / points.length : 0;
  const slidesOk = input.slidesCovered >= 3;

  const uLevel: RubricLevel = cRatio >= 0.9 && slidesOk ? "exceeding" : cRatio >= 0.5 ? "meeting" : "below";
  const qLevel: RubricLevel = input.slidesCovered >= 5 && cRatio >= 0.9 ? "exceeding" : slidesOk && cRatio >= 0.4 ? "meeting" : "below";
  const cScore = (durOk ? 1 : 0) + (framingOk ? 1 : 0) + (pace ? 1 : 0);
  const cLevel: RubricLevel = cScore === 3 ? "exceeding" : cScore >= 1 ? "meeting" : "below";
  const priors = i.priorEvaluations;
  const iLevel: RubricLevel =
    words < 20 ? "below" : priors.length >= 2 && priors.every((e) => e.overall === "exceeding") ? "exceeding" : "meeting";

  const rubric: Rubric = {
    understanding: {
      level: uLevel,
      rationale: `Your talk covered ${covered.length} of ${points.length} deliverable and requirement points${
        missing[0] ? `, but ${lowerFirst(shortPhrase(missing[0], 6))} was barely mentioned` : ""
      }.`,
    },
    quality: {
      level: qLevel,
      rationale:
        input.slidesCovered >= 3
          ? `You walked through ${plural(input.slidesCovered, "slide")}, but your talk covered ${Math.round(cRatio * 100)}% of the key points from the brief.`
          : `You covered ${plural(input.slidesCovered, "slide")} (aim for at least 3) and ${Math.round(cRatio * 100)}% of the key points from the brief.`,
    },
    communication: {
      level: cLevel,
      rationale: `Your talk ran ${Math.round(dur)} seconds at about ${Math.round(wpm)} words per minute, with ${framingOk ? "good" : "weak"} camera framing (${Math.round(input.framingScore * 100)}%).`,
    },
    independence: {
      level: iLevel,
      rationale: `You ${words < 20 ? "barely spoke" : "delivered the talk"} and had ${plural(priors.length, "earlier evaluation")} to build on.`,
    },
  };
  return finish(i.stage, i.scenario.title, rubric);
}
