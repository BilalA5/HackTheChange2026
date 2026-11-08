// Mock: Plan-mode negotiation and Learn-mode tutoring.
import type { ChatMessage, Scenario, Stage } from "@pw/shared";
import { capitalise, pickBest, sentencesOf, shortPhrase, wordCount } from "../text.ts";

const AGREE_PATTERNS = [
  /\byes\b/i,
  /\bsounds good\b/i,
  /\bsounds great\b/i,
  /\bagreed?\b/i,
  /let'?s do it/i,
  /\bworks for me\b/i,
  /\bthat works\b/i,
  /\bok\b|\bokay\b/i,
  /\blgtm\b/i,
];
const QUESTION_START = /^(what|how|why|can|could|does|do|is|are|should|which|when|where)\b/i;

export function isAgreement(message: string): boolean {
  return AGREE_PATTERNS.some((p) => p.test(message));
}

export function isQuestion(message: string): boolean {
  return message.includes("?") || QUESTION_START.test(message.trim());
}

/** Sentence after "also" or "add", e.g. "sounds good, also add a retry limit" -> "A retry limit". */
export function extraRequirement(message: string): string | null {
  const m = message.match(/\b(?:also|add)\b[:,]?\s+(?:(?:also|add|please)\s+)*([^.!?;\n]+)/i);
  if (!m) return null;
  const clause = m[1].split(",")[0].trim();
  return clause.length >= 4 ? capitalise(clause) : null;
}

/** Turn a requirement sentence into a short imperative todo. */
export function toTodo(requirement: string): string {
  const text = requirement.trim().replace(/[.;]+$/, "");
  const words = text.split(/\s+/);
  const first = words[0] ?? "";
  if (/^(?:ch|sh|ss|x)[a-z]*es$/i.test(first) || /(?:ch|sh|ss|x)es$/i.test(first)) {
    words[0] = first.slice(0, -2);
  } else if (/s$/i.test(first) && !/ss$/i.test(first) && first.length > 3) {
    words[0] = first.slice(0, -1);
  }
  return capitalise(shortPhrase(words.join(" "), 24));
}

function numbered(items: string[]): string {
  return items.map((r, i) => `${i + 1}. ${r}`).join("\n");
}

export function planTurnMock(i: {
  stage: Stage;
  scenario?: Scenario;
  history: ChatMessage[];
  message: string;
}): { reply: string; agreedRequirements: string[]; estimatedMinutes: number | null; isComplete: boolean; todos: string[] } {
  const { stage, message } = i;
  const proposed = i.history.some((m) => m.role === "npc" && /(^|\n)\s*1\./.test(m.text));
  const scopeList = numbered(stage.requirements);

  // First learner message: the manager proposes the scope and an estimate.
  if (!proposed) {
    const reply =
      `${stage.planOpener.trim()}\n\nHere's the scope I'd sign off on:\n${scopeList}\n\n` +
      `I'd estimate about ${stage.estMinutes} minutes for this. Does that scope work for you?`;
    return { reply, agreedRequirements: [], estimatedMinutes: null, isComplete: false, todos: [] };
  }

  if (isQuestion(message)) {
    const candidates = [...stage.requirements, ...stage.learn.flatMap((l) => sentencesOf(l.body))];
    const best = pickBest(candidates, message, 1)[0];
    const answer = best
      ? `${best.replace(/[.]+$/, "")}.`
      : "The requirements above are the core of this stage, so they're the best guide here.";
    return {
      reply: `${answer} Does that scope work for you, or should we change anything?`,
      agreedRequirements: [],
      estimatedMinutes: null,
      isComplete: false,
      todos: [],
    };
  }

  if (isAgreement(message)) {
    const extra = extraRequirement(message);
    const agreedRequirements = extra ? [...stage.requirements, extra] : [...stage.requirements];
    const minutes = stage.estMinutes;
    return {
      reply:
        `Perfect, we're agreed. That's ${agreedRequirements.length} requirements and about ${minutes} minutes. ` +
        "I've put them on your list. Let's build it.",
      agreedRequirements,
      estimatedMinutes: minutes,
      isComplete: true,
      todos: agreedRequirements.map(toTodo),
    };
  }

  // Anything else: restate the scope and ask again.
  return {
    reply: `Noted. Here's the scope as it stands:\n${scopeList}\n\nDoes that work for you?`,
    agreedRequirements: [],
    estimatedMinutes: null,
    isComplete: false,
    todos: [],
  };
}

export function learnChatMock(i: { stage: Stage; message: string }): string {
  const { stage, message } = i;
  const sentences = stage.learn.flatMap((l) => sentencesOf(l.body));
  let picks = pickBest(sentences, message, 3);
  if (picks.length === 0) picks = sentences.slice(0, 2);
  const focus = stage.requirements[0] ?? stage.title;
  const bullets = picks.map((s) => `- ${s}`).join("\n");
  if (wordCount(message) < 2) {
    return `Here's what matters most for this stage:\n${bullets}\n\nTry it: start with "${shortPhrase(focus, 10)}" and check your result against it.`;
  }
  return `${bullets}\n\nTry it on your project now: start with "${shortPhrase(focus, 10)}", then come back if a step is unclear.`;
}
