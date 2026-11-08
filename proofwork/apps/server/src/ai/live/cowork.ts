// Live co-worker turn: streamed text plus one-shot tool actions (todos, highlight, resource, xp).
import type { Npc, Scenario, Stage } from "@pw/shared";
import type { ModelTier } from "../../contracts.ts";
import type { ContentBlock, Llm, ToolDef, ToolUse } from "../llm.ts";
import { imageBlock } from "../llm.ts";
import { clip, personaBlock } from "./common.ts";

type Todo = { id: string; text: string; done: boolean };

export interface CoworkLiveInput {
  scenario: Scenario;
  stage: Stage;
  npc: Npc;
  learnerName: string;
  agreedRequirements: string[];
  todos: Todo[];
  history: { role: "npc" | "learner" | "system"; text: string }[];
  input:
    | { kind: "text"; text: string }
    | { kind: "event"; event: string }
    | { kind: "im_lost"; question: string }
    | { kind: "highlight"; query: string }
    | { kind: "intro" };
  screenshot?: string;
  focusedApp?: string;
  windowTitle?: string;
  tier: ModelTier;
}

export interface CoworkLiveResult {
  text: string;
  todos?: Todo[];
  highlight?: { rect: { x: number; y: number; w: number; h: number }; label: string };
  resource?: { title: string; body: string; url?: string };
  xp?: { amount: number; reason: string };
}

const unit = { type: "number", minimum: 0, maximum: 1 } as const;

export const COWORK_TOOLS: ToolDef[] = [
  {
    name: "set_todos",
    description: "Replace the learner's todo list for this stage. Use only when the list should genuinely change, for example at intro.",
    input_schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          maxItems: 12,
          items: {
            type: "object",
            properties: { text: { type: "string" }, done: { type: "boolean" } },
            required: ["text", "done"],
            additionalProperties: false,
          },
        },
      },
      required: ["items"],
      additionalProperties: false,
    },
    eager_input_streaming: true,
  },
  {
    name: "highlight",
    description: "Point at one region of the learner's screenshot. Coordinates are normalised 0 to 1 of the screenshot.",
    input_schema: {
      type: "object",
      properties: { x: unit, y: unit, w: unit, h: unit, label: { type: "string" } },
      required: ["x", "y", "w", "h", "label"],
      additionalProperties: false,
    },
    eager_input_streaming: true,
  },
  {
    name: "share_resource",
    description: "Share one short resource such as a tip, a doc excerpt or a link relevant to the next step.",
    input_schema: {
      type: "object",
      properties: { title: { type: "string" }, body: { type: "string" }, url: { type: "string" } },
      required: ["title", "body"],
      additionalProperties: false,
    },
    eager_input_streaming: true,
  },
  {
    name: "award_xp",
    description: "Award a small amount of XP for a clear step the learner just completed. Use sparingly.",
    input_schema: {
      type: "object",
      properties: { amount: { type: "integer", minimum: 10, maximum: 50 }, reason: { type: "string" } },
      required: ["amount", "reason"],
      additionalProperties: false,
    },
    eager_input_streaming: true,
  },
];

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function parseTodos(input: unknown, existing: Todo[]): Todo[] | null {
  const items = (input as { items?: unknown })?.items;
  if (!Array.isArray(items)) return null;
  const out: Todo[] = [];
  items.slice(0, 12).forEach((raw, idx) => {
    const it = raw as { text?: unknown; done?: unknown };
    if (typeof it.text !== "string" || !it.text.trim() || typeof it.done !== "boolean") return;
    const text = it.text.trim().slice(0, 160);
    const match = existing.find((t) => t.text.toLowerCase() === text.toLowerCase());
    out.push({ id: match?.id ?? `t${Date.now().toString(36)}${idx}`, text, done: it.done });
  });
  return out.length ? out : null;
}

export function parseHighlight(input: unknown): CoworkLiveResult["highlight"] | null {
  const v = input as Record<string, unknown>;
  const x = num(v?.x), y = num(v?.y), w = num(v?.w), h = num(v?.h);
  if (x === null || y === null || w === null || h === null) return null;
  if (x < 0 || y < 0 || w <= 0 || h <= 0 || x > 1 || y > 1 || x + w > 1.0001 || y + h > 1.0001) return null;
  if (typeof v.label !== "string" || !v.label.trim()) return null;
  return { rect: { x, y, w, h }, label: v.label.trim().slice(0, 120) };
}

export function parseResource(input: unknown): CoworkLiveResult["resource"] | null {
  const v = input as Record<string, unknown>;
  if (typeof v?.title !== "string" || typeof v.body !== "string" || !v.title.trim() || !v.body.trim()) return null;
  const url = typeof v.url === "string" && /^https:\/\//.test(v.url) ? v.url.slice(0, 500) : undefined;
  return { title: v.title.slice(0, 120), body: v.body.slice(0, 1500), ...(url ? { url } : {}) };
}

export function parseXp(input: unknown): CoworkLiveResult["xp"] | null {
  const v = input as Record<string, unknown>;
  const amount = v?.amount;
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 10 || amount > 50) return null;
  if (typeof v.reason !== "string" || !v.reason.trim()) return null;
  return { amount, reason: v.reason.trim().slice(0, 160) };
}

const SYSTEM = (i: CoworkLiveInput) =>
  `
${personaBlock(i.npc, i.scenario)}
You are the AI co-worker sitting beside ${i.learnerName} while they do "${i.stage.title}" on their own screen.
Stage goal: ${i.stage.summary}
Agreed requirements: ${i.agreedRequirements.length ? i.agreedRequirements.map((r) => `"${r}"`).join("; ") : "not yet agreed"}
Todos: ${i.todos.length ? i.todos.map((t) => `${t.done ? "[x]" : "[ ]"} ${t.text}`).join("; ") : "none yet"}

How to help:
- Be practical and specific. Reference the agreed requirements and the first undone todo.
- Guide, do not do the work for them. Give the next concrete step.
- Keep replies short: 2 to 5 sentences or a short numbered list.
- Use the screenshot only for what is visible on it. If you cannot see something, say so.
- Use tools only when they help: set_todos to change the list, highlight to point at something on screen, share_resource for a tip, award_xp rarely for a clear completed step.
`.trim();

function inputText(i: CoworkLiveInput): string {
  const inp = i.input;
  switch (inp.kind) {
    case "intro":
      return `Start the session. Greet ${i.learnerName} by name, restate the goal, and set todos from the agreed requirements if none exist.`;
    case "text":
      return `${i.learnerName} says: ${clip(inp.text, 1000)}`;
    case "im_lost":
      return `${i.learnerName} says they are lost. Their question: ${clip(inp.question, 600)}. Give a 3-step mini plan.`;
    case "highlight":
      return `Point at this on the screen: ${clip(inp.query, 200)}. Use the highlight tool.`;
    case "event":
      return `Screen event: ${inp.event}. Nudge only if it is useful, and keep it brief.`;
  }
}

function contextLines(i: CoworkLiveInput): string {
  const parts = [i.focusedApp ? `Focused app: ${i.focusedApp}` : "", i.windowTitle ? `Window: ${i.windowTitle}` : ""].filter(Boolean);
  return parts.join(". ");
}

/** Chat history as alternating turns: roles merged, starting with a user turn. */
function historyMessages(history: CoworkLiveInput["history"]): { role: "user" | "assistant"; content: string }[] {
  const out: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of history.slice(-20)) {
    const role = m.role === "npc" ? "assistant" : "user";
    const text = clip(m.text, 1200);
    const last = out[out.length - 1];
    if (last && last.role === role) last.content = `${last.content}\n${text}`;
    else out.push({ role, content: text });
  }
  if (out[0]?.role === "assistant") out.unshift({ role: "user", content: "(session started)" });
  return out;
}

export async function coworkTurnLive(
  llm: Llm,
  i: CoworkLiveInput,
  onDelta: (d: string) => void,
): Promise<CoworkLiveResult> {
  const blocks: ContentBlock[] = [];
  const image = imageBlock(i.screenshot);
  if (image) blocks.push(image);
  const ctx = contextLines(i);
  blocks.push({ type: "text", text: [ctx, inputText(i)].filter(Boolean).join("\n\n") });

  const past = historyMessages(i.history);
  const messages: { role: "user" | "assistant"; content: string | ContentBlock[] }[] = past.map((m) => ({ role: m.role, content: m.content }));
  const last = messages[messages.length - 1];
  if (last && last.role === "user") {
    // Two user turns in a row would be merged by the API; merge explicitly to keep the screenshot.
    messages[messages.length - 1] = { role: "user", content: [{ type: "text", text: String(last.content) }, ...blocks] };
  } else {
    messages.push({ role: "user", content: blocks });
  }

  const res = await llm.stream({
    tier: i.tier,
    system: SYSTEM(i),
    messages: messages as { role: "user" | "assistant"; content: string | ContentBlock[] }[],
    tools: COWORK_TOOLS,
    maxTokens: 1200,
    onDelta,
  });

  const result: CoworkLiveResult = { text: res.text.trim() };
  if (!result.text) throw new Error("empty co-worker reply");

  for (const tool of res.toolUses as ToolUse[]) {
    if (tool.name === "set_todos" && !result.todos) result.todos = parseTodos(tool.input, i.todos) ?? undefined;
    else if (tool.name === "highlight" && !result.highlight) result.highlight = parseHighlight(tool.input) ?? undefined;
    else if (tool.name === "share_resource" && !result.resource) result.resource = parseResource(tool.input) ?? undefined;
    else if (tool.name === "award_xp" && !result.xp) result.xp = parseXp(tool.input) ?? undefined;
  }
  return result;
}
