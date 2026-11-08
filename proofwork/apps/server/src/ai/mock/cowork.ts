// Mock co-worker turns. Deterministic guidance that references the agreed requirements and the first
// undone todo. Streams word chunks through onDelta so the UI behaves like the live engine.
import type { Stage } from "@pw/shared";
import { overlap, pickBest, sentencesOf, shortPhrase, wordChunks, lowerFirst } from "../text.ts";
import type { AiEngine } from "../../contracts.ts";

type CoworkInput = Parameters<AiEngine["coworkTurn"]>[0];
type CoworkResult = Awaited<ReturnType<AiEngine["coworkTurn"]>>;
type Todo = { id: string; text: string; done: boolean };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const DONE_RE = /\b(done|finished|completed|complete|got it working)\b/i;

export async function emit(text: string, onDelta: (d: string) => void): Promise<void> {
  for (const chunk of wordChunks(text)) {
    onDelta(chunk);
    await sleep(15);
  }
}

function firstUndone(todos: Todo[]): Todo | undefined {
  return todos.find((t) => !t.done);
}

function todosFromRequirements(stage: Stage, existing: Todo[]): Todo[] {
  if (existing.length) return existing;
  return stage.requirements.map((text, i) => ({ id: `t${i + 1}`, text, done: false }));
}

export async function coworkTurnMock(i: CoworkInput): Promise<CoworkResult> {
  const { stage, npc, learnerName, input, todos: incoming, onDelta } = i;
  let todos = todosFromRequirements(stage, incoming.map((t) => ({ ...t })));
  const next = firstUndone(todos);
  const nextText = next ? `"${shortPhrase(next.text, 12)}"` : "the stage requirements";
  const result: CoworkResult = { text: "" };
  let text: string;

  switch (input.kind) {
    case "intro": {
      const changed = incoming.length === 0;
      text =
        `Hi ${learnerName}, I'm ${npc.name}, ${npc.role}. Today's goal is ${stage.title}: ${stage.summary} ` +
        (changed ? "I've put the agreed requirements on your list. " : "") +
        `Start with ${nextText}. Want me to point at anything on your screen first?`;
      if (changed) result.todos = todos;
      break;
    }

    case "highlight": {
      const label = input.query ? `Here: ${shortPhrase(input.query, 6)}` : "Look here";
      text = `Here's the area I mean. ${label}.`;
      result.highlight = { rect: { x: 0.35, y: 0.3, w: 0.3, h: 0.2 }, label };
      break;
    }

    case "im_lost": {
      text =
        `Let's take it one step at a time.\n1. Re-read ${nextText} and say it back in your own words.\n` +
        "2. Break it into the smallest piece you can finish in about ten minutes.\n" +
        "3. Do that piece, then tell me what you see on screen.";
      break;
    }

    case "event": {
      if (input.event === "stuck") {
        text = `Looks like you're stuck. Start with ${nextText}, and take just the first step.`;
      } else {
        text = `I noticed you've moved on. Are you still working on ${nextText}?`;
      }
      break;
    }

    case "text": {
      const msg = input.text;
      if (DONE_RE.test(msg) && next && overlap(msg, next.text) > 0) {
        todos = todos.map((t) => (t.id === next.id ? { ...t, done: true } : t));
        result.todos = todos;
        const after = firstUndone(todos);
        text = after
          ? `Nice, that's ticked off. Next up is ${shortPhrase(after.text, 12)}.`
          : "Nice, that's the last item on your list. Check your work against the requirements, then submit when you're ready.";
        break;
      }
      const hits = pickBest(stage.learn.flatMap((l) => sentencesOf(l.body)), msg, 1);
      const hint = hits[0] ? ` A useful pointer: ${lowerFirst(hits[0])}` : "";
      const screen = i.focusedApp ? ` I can see you're in ${i.focusedApp}.` : "";
      text = `Good question.${screen} Right now the next thing on your list is ${nextText}.${hint}`.trim();
      break;
    }
  }

  await emit(text, onDelta);
  result.text = text;
  return result;
}
