// Live: Plan-mode negotiation (quality tier) and Learn-mode tutoring (fast tier).
import type { ChatMessage, Npc, Scenario, Stage } from "@pw/shared";
import type { Llm } from "../llm.ts";
import { clip, obj, personaBlock, str, strArr, STRING_ARRAY } from "./common.ts";

const PLAN_SYSTEM = (npc: Npc, scenario: Scenario, stage: Stage) =>
  `
${personaBlock(npc, scenario)}
You are negotiating the scope of stage "${stage.title}" in Plan mode. Stage summary: ${stage.summary}
The scope you proposed (requirements): ${stage.requirements.map((r) => `"${r}"`).join("; ")}. Estimated time: ${stage.estMinutes} minutes.

Rules:
- If the learner has not seen a proposal yet, propose the requirements as a numbered list with the time estimate, then ask whether the scope works.
- If the learner asks a question, answer it from the requirements and the stage material, then re-ask for agreement. Do not mark it complete.
- If the learner agrees (for example "yes", "sounds good", "agreed", "let's do it", "works for me", "ok", "lgtm"), set isComplete true. agreedRequirements is the stage requirements plus any extra requirement the learner proposed after "also" or "add". estimatedMinutes is ${stage.estMinutes}. todos are short imperative versions of the agreed requirements.
- If the learner proposes a change without agreeing, discuss it briefly and keep the scope until they agree.
- Until agreement: isComplete false, agreedRequirements [], estimatedMinutes null, todos [].
Keep "reply" to 2 to 6 short lines, in your voice.
`.trim();

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    agreedRequirements: STRING_ARRAY,
    estimatedMinutes: { anyOf: [{ type: "integer" }, { type: "null" }] },
    isComplete: { type: "boolean" },
    todos: STRING_ARRAY,
  },
  required: ["reply", "agreedRequirements", "estimatedMinutes", "isComplete", "todos"],
  additionalProperties: false,
};

export async function planTurnLive(
  llm: Llm,
  i: { scenario: Scenario; stage: Stage; npc: Npc; history: ChatMessage[]; message: string },
): Promise<{ reply: string; agreedRequirements: string[]; estimatedMinutes: number | null; isComplete: boolean; todos: string[] }> {
  const transcript = i.history
    .slice(-20)
    .map((m) => `${m.role === "npc" ? i.npc.name : m.role === "learner" ? "Learner" : "System"}: ${clip(m.text, 800)}`)
    .join("\n");
  return llm.json({
    tier: "quality",
    system: PLAN_SYSTEM(i.npc, i.scenario, i.stage),
    content: `Conversation so far:\n${transcript || "(none)"}\n\nLearner's latest message:\n<message>\n${clip(i.message, 1000)}\n</message>`,
    schema: PLAN_SCHEMA,
    maxTokens: 900,
    validate: (raw) => {
      const v = obj(raw, "plan turn");
      const isComplete = v.isComplete === true;
      if (!isComplete) {
        return { reply: str(v.reply, "reply", 1500), agreedRequirements: [], estimatedMinutes: null, isComplete: false, todos: [] };
      }
      const agreed = strArr(v.agreedRequirements, "agreedRequirements", 12);
      const requirements = agreed.length ? agreed : i.stage.requirements;
      const est = typeof v.estimatedMinutes === "number" ? Math.round(v.estimatedMinutes) : i.stage.estMinutes;
      const todos = strArr(v.todos, "todos", 12);
      return {
        reply: str(v.reply, "reply", 1500),
        agreedRequirements: requirements,
        estimatedMinutes: est,
        isComplete: true,
        todos: todos.length ? todos : requirements,
      };
    },
  });
}

const LEARN_SYSTEM = (scenario: Scenario, stage: Stage) =>
  `
You are a practical tutor in Learn mode for the project "${scenario.title}", stage "${stage.title}". Answer from the micro-training material below, not from memory.
Give 2 to 3 short, practical points relevant to the question. Finish with one nudge to try it on their project.
Keep it under 150 words. Use plain sentences or short bullets.

Material:
${stage.learn.map((l) => `## ${l.title}\n${l.body}`).join("\n\n")}
`.trim();

export async function learnChatLive(
  llm: Llm,
  i: { scenario: Scenario; stage: Stage; history: ChatMessage[]; message: string },
): Promise<string> {
  const history = i.history
    .slice(-8)
    .map((m) => `${m.role === "npc" ? "Tutor" : "Learner"}: ${clip(m.text, 400)}`)
    .join("\n");
  const text = await llm.complete({
    tier: "fast",
    system: LEARN_SYSTEM(i.scenario, i.stage),
    content: `${history ? `Recent chat:\n${history}\n\n` : ""}Learner question: ${clip(i.message, 800)}`,
    maxTokens: 600,
  });
  return text.trim();
}
