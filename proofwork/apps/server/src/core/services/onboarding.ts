// FTUX onboarding: a server-side step machine persisted per session. Completing it sets user.onboardingComplete.
import type { FtuxTurn, FtuxView, VisionBoard } from "@pw/shared";
import type { FtuxSession } from "../../contracts.ts";
import { one, run } from "../db.ts";
import { badRequest, notFound } from "../errors.ts";
import type { Core } from "../types.ts";
import { nowIso, uid, withLock } from "../util.ts";
import { asObject, optStr, reqEnum, reqStr } from "../validate.ts";
import { addRecommendedTrainings } from "./trainings.ts";
import { emptyVision, requireUser, saveUser } from "./users.ts";

const TURN_KINDS = ["CONTINUE", "DRAWN", "MESSAGE", "SELECT_CAREER", "WHY", "CLAIM"] as const;

interface SessionRow {
  id: string;
  user_id: string;
  view: string;
  memory: string;
  done: number;
}

export function parseTurn(raw: unknown): FtuxTurn {
  const o = asObject(raw, "turn");
  const kind = reqEnum(o, "kind", TURN_KINDS);
  switch (kind) {
    case "CONTINUE":
      return { kind };
    case "CLAIM":
      return { kind };
    case "DRAWN": {
      const dataUrl = reqStr(o, "dataUrl", { max: 4_000_000 });
      if (!dataUrl.startsWith("data:image/")) throw badRequest("dataUrl must be an image data URL.");
      const description = optStr(o, "description", { max: 1000 });
      return description ? { kind, dataUrl, description } : { kind, dataUrl };
    }
    case "MESSAGE":
      return { kind, text: reqStr(o, "text", { max: 2000 }) };
    case "WHY":
      return { kind, text: reqStr(o, "text", { max: 2000 }) };
    case "SELECT_CAREER":
      return { kind, careerId: reqStr(o, "careerId", { max: 128 }) };
  }
}

function saveSession(core: Core, row: { id: string; userId: string; view: FtuxView; memory: Record<string, unknown>; created?: boolean }): void {
  const done = row.view.step === "done" ? 1 : 0;
  if (row.created) {
    run(core.db, "INSERT INTO ftux_sessions (id, user_id, view, memory, done, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [
      row.id,
      row.userId,
      JSON.stringify(row.view),
      JSON.stringify(row.memory),
      done,
      nowIso(),
      nowIso(),
    ]);
  } else {
    run(core.db, "UPDATE ftux_sessions SET view = ?, memory = ?, done = ?, updated_at = ? WHERE id = ?", [
      JSON.stringify(row.view),
      JSON.stringify(row.memory),
      done,
      nowIso(),
      row.id,
    ]);
  }
}

export function startSession(core: Core, userId: string): FtuxView {
  const open = one<SessionRow>(core.db, "SELECT id, user_id, view, memory, done FROM ftux_sessions WHERE user_id = ? AND done = 0 ORDER BY created_at DESC LIMIT 1", [userId]);
  if (open) return JSON.parse(open.view) as FtuxView;
  const id = uid();
  const user = requireUser(core.db, userId);
  const view = core.ai.ftuxStart({ sessionId: id, user });
  saveSession(core, { id, userId, view, memory: {}, created: true });
  return view;
}

export async function sessionTurn(
  core: Core,
  userId: string,
  body: unknown,
): Promise<{ status: 200 | 409; view: FtuxView }> {
  const o = asObject(body);
  const sessionId = reqStr(o, "sessionId", { max: 128 });
  const turn = parseTurn(o.turn);
  return withLock(`ftux:${sessionId}`, async () => {
    const row = one<SessionRow>(core.db, "SELECT id, user_id, view, memory, done FROM ftux_sessions WHERE id = ?", [sessionId]);
    if (!row || row.user_id !== userId) throw notFound("Onboarding session not found.");
    const current = JSON.parse(row.view) as FtuxView;
    if (current.step === "done") return { status: 409 as const, view: current };

    const user = requireUser(core.db, userId);
    const session: FtuxSession = { id: row.id, userId, view: current, memory: JSON.parse(row.memory) as Record<string, unknown> };
    const result = await core.ai.ftuxTurn({ session, turn, user, careers: core.content.careers, scenarios: core.content.scenarios });

    user.vision = { ...(user.vision ?? emptyVision()), ...result.board } as VisionBoard;
    if (result.careerId && core.content.getCareer(result.careerId)) {
      user.careerId = result.careerId;
      addRecommendedTrainings(core, userId, result.careerId);
    }
    if (result.view.step === "done") user.onboardingComplete = true;
    saveUser(core.db, user);
    saveSession(core, { id: row.id, userId, view: result.view, memory: result.memory });
    return { status: 200 as const, view: result.view };
  });
}

