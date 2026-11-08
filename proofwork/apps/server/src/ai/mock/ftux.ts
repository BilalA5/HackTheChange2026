// Onboarding step machine: draw -> chat -> recommend -> roadmap -> why -> claim -> done.
// Deterministic in both modes so onboarding never depends on a model call.
import type { ChatMessage, Career, FtuxStep, FtuxTurn, FtuxView, Scenario, User, VisionBoard } from "@pw/shared";
import { PLANS } from "@pw/shared";
import type { FtuxSession } from "../../contracts.ts";
import { overlap } from "../text.ts";

export const DRAW_PROMPT = "Draw what your dream job looks like. Stick figures welcome.";

interface Question {
  prompt: string;
  chips: string[];
  fields: (keyof VisionBoard)[];
}

const QUESTIONS: Question[] = [
  {
    prompt: "What role are you aiming for?",
    chips: ["AI Engineer", "Product Manager", "Data Analyst", "Not sure yet"],
    fields: ["targetRole"],
  },
  {
    prompt: "What industry, and what kind of company?",
    chips: ["Startup", "Scale-up", "Enterprise"],
    fields: ["industry", "companyType"],
  },
  {
    prompt: "Where would you like to work?",
    chips: ["Remote", "New York", "London", "Berlin"],
    fields: ["location"],
  },
  {
    prompt: "How soon do you want to land it?",
    chips: ["1 month", "3 months", "6 months"],
    fields: ["timeline"],
  },
];

const COMPANY_TYPES = ["Startup", "Scale-up", "Enterprise"];
const FREE_CREDITS = PLANS.find((p) => p.id === "free")?.credits ?? 10_000;

function humanise(id: string): string {
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function baseView(sessionId: string, patch: Partial<FtuxView>): FtuxView {
  return {
    sessionId,
    step: "draw",
    prompt: DRAW_PROMPT,
    chips: [],
    messages: [],
    board: {},
    recommendations: [],
    roadmap: null,
    claim: null,
    ...patch,
  };
}

function npcMessage(sessionId: string, index: number, text: string): ChatMessage {
  return { id: `${sessionId}-m${index}`, role: "npc", text, at: new Date().toISOString() };
}

function learnerMessage(sessionId: string, index: number, text: string): ChatMessage {
  return { id: `${sessionId}-m${index}`, role: "learner", text, at: new Date().toISOString() };
}

export function ftuxStartMock(i: { sessionId: string }): FtuxView {
  return baseView(i.sessionId, { step: "draw", prompt: DRAW_PROMPT });
}

function chatView(sessionId: string, messages: ChatMessage[], board: Partial<VisionBoard>, qIndex: number): FtuxView {
  const q = QUESTIONS[qIndex];
  return baseView(sessionId, { step: "chat", prompt: q.prompt, chips: q.chips, messages, board });
}

/** Rank careers by keyword overlap with the role and industry answers; equal when "Not sure yet". */
export function rankCareers(
  careers: Career[],
  board: Partial<VisionBoard>,
): { careerId: string; title: string; reason: string; match: number }[] {
  const query = [board.targetRole, board.industry, board.companyType].filter(Boolean).join(" ");
  const unsure = !board.targetRole || board.targetRole === "Not sure yet";
  const scored = careers.map((c) => {
    const hit = unsure ? 0 : overlap(`${c.title} ${c.tagline} ${c.skills.join(" ")}`, query);
    return { c, hit };
  });
  const top = Math.max(...scored.map((s) => s.hit), 0);
  return scored
    .sort((a, b) => b.hit - a.hit || careers.indexOf(a.c) - careers.indexOf(b.c))
    .slice(0, 3)
    .map(({ c, hit }) => {
      const base = unsure ? 60 : top === 0 ? 55 : 60 + Math.round((hit / Math.max(top, 1)) * 35);
      const match = Math.min(98, base);
      const reason = unsure
        ? `${c.tagline} A good starting point while you explore.`
        : hit > 0
          ? `Matches your ${board.targetRole} goal: ${c.tagline}`
          : `${c.tagline} A reasonable alternative to your goal.`;
      return { careerId: c.id, title: c.title, reason, match };
    });
}

export function ftuxTurnMock(i: {
  session: FtuxSession;
  turn: FtuxTurn;
  user: User;
  careers: Career[];
  scenarios: Scenario[];
}): { view: FtuxView; memory: Record<string, unknown>; board: Partial<VisionBoard>; careerId?: string } {
  const { session, turn, careers, scenarios } = i;
  const current = session.view;
  const memory: Record<string, unknown> = { ...session.memory };
  const board: Partial<VisionBoard> = { ...current.board };
  const stay = (): { view: FtuxView; memory: Record<string, unknown>; board: Partial<VisionBoard> } => ({
    view: current,
    memory,
    board: current.board,
  });
  const messages = [...current.messages];
  const nextIndex = () => messages.length + 1;

  switch (current.step as FtuxStep) {
    case "draw": {
      if (turn.kind !== "DRAWN" && turn.kind !== "CONTINUE") return stay();
      if (turn.kind === "DRAWN") {
        if (!turn.dataUrl.startsWith("data:image/")) return stay();
        board.drawingDataUrl = turn.dataUrl;
      }
      memory.qIndex = 0;
      messages.push(npcMessage(session.id, nextIndex(), "Thanks, that gives me a picture. Let's make it concrete."));
      messages.push(npcMessage(session.id, nextIndex(), QUESTIONS[0].prompt));
      return { view: chatView(session.id, messages, board, 0), memory, board };
    }

    case "chat": {
      if (turn.kind !== "MESSAGE") return stay();
      const text = turn.text.trim().slice(0, 120);
      if (!text) return stay();
      const qIndex = typeof memory.qIndex === "number" ? memory.qIndex : 0;
      if (qIndex < 0 || qIndex >= QUESTIONS.length) return stay();
      messages.push(learnerMessage(session.id, nextIndex(), text));

      if (qIndex === 0) {
        board.targetRole = text;
      } else if (qIndex === 1) {
        board.industry = text;
        board.companyType = COMPANY_TYPES.find((t) => text.toLowerCase().includes(t.toLowerCase())) ?? "Unspecified";
      } else if (qIndex === 2) {
        board.location = text;
      } else if (qIndex === 3) {
        board.timeline = text;
      }

      const answered = qIndex + 1;
      memory.qIndex = answered;
      if (answered < QUESTIONS.length) {
        messages.push(npcMessage(session.id, nextIndex(), QUESTIONS[answered].prompt));
        return { view: chatView(session.id, messages, board, answered), memory, board };
      }

      const recommendations = rankCareers(careers, board);
      messages.push(npcMessage(session.id, nextIndex(), "Thanks, I have enough to suggest a few careers."));
      const view = baseView(session.id, {
        step: "recommend",
        prompt: "Here are the careers that fit you best. Pick one to see your roadmap.",
        messages,
        board,
        recommendations,
      });
      return { view, memory, board };
    }

    case "recommend": {
      if (turn.kind !== "SELECT_CAREER") return stay();
      const career = careers.find((c) => c.id === turn.careerId);
      if (!career) return stay();
      const roadmapScenarios = scenarios
        .filter((s) => s.careerId === career.id)
        .sort((a, b) => a.order - b.order)
        .map((s) => ({
          scenarioId: s.id,
          title: s.title,
          company: humanise(s.companyId),
          estMinutes: s.estMinutes,
        }));
      memory.careerId = career.id;
      const view = baseView(session.id, {
        step: "roadmap",
        prompt: `Your ${career.title} roadmap. Here's the first project and what follows.`,
        messages,
        board,
        recommendations: current.recommendations,
        roadmap: { careerId: career.id, scenarios: roadmapScenarios },
      });
      return { view, memory, board, careerId: career.id };
    }

    case "roadmap": {
      if (turn.kind !== "CONTINUE") return stay();
      const view = baseView(session.id, {
        step: "why",
        prompt: "What's driving you?",
        messages,
        board,
        recommendations: current.recommendations,
        roadmap: current.roadmap,
      });
      return { view, memory, board };
    }

    case "why": {
      if (turn.kind !== "WHY") return stay();
      const text = turn.text.trim().slice(0, 400);
      if (!text) return stay();
      board.why = text;
      const view = baseView(session.id, {
        step: "claim",
        prompt: "Claim your starter credits to begin.",
        messages,
        board,
        recommendations: current.recommendations,
        roadmap: current.roadmap,
        claim: { credits: FREE_CREDITS, claimed: false },
      });
      return { view, memory, board };
    }

    case "claim": {
      if (turn.kind !== "CLAIM") return stay();
      const view = baseView(session.id, {
        step: "done",
        prompt: "You're all set. Your first project is waiting on the map.",
        messages,
        board,
        recommendations: current.recommendations,
        roadmap: current.roadmap,
        claim: { credits: current.claim?.credits ?? FREE_CREDITS, claimed: true },
      });
      return { view, memory, board };
    }

    case "done":
    default:
      return stay();
  }
}
