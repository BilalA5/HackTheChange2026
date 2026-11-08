import type { FtuxStep, FtuxTurn, FtuxView } from "@pw/shared";

/** Props shared by every step. `send` posts a turn; the page adopts the returned view. */
export interface StepProps {
  view: FtuxView;
  /** True while a turn is in flight. Disable every action. */
  busy: boolean;
  send(turn: FtuxTurn): void;
}

/** Server order: draw → chat → why → recommend → roadmap → claim. */
export const FTUX_STEPS: { id: Exclude<FtuxStep, "done">; label: string }[] = [
  { id: "draw", label: "Draw" },
  { id: "chat", label: "Chat" },
  { id: "why", label: "Why" },
  { id: "recommend", label: "Match" },
  { id: "roadmap", label: "Roadmap" },
  { id: "claim", label: "Claim" },
];

/** Narrowing guard for a server view (used for 409 bodies, which may be anything). */
export function isFtuxView(value: unknown): value is FtuxView {
  if (typeof value !== "object" || value === null) return false;
  const v = value as { sessionId?: unknown; step?: unknown };
  return typeof v.sessionId === "string" && typeof v.step === "string";
}
