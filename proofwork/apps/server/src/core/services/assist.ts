// Coach chat, support thread and bug reports.
import { FEATURE_TAXONOMY, type BugReportInput, type ChatMessage } from "@pw/shared";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { all, run, type Db } from "../db.ts";
import { badRequest } from "../errors.ts";
import type { Core } from "../types.ts";
import { nowIso, uid } from "../util.ts";
import { asObject, optStr, reqEnum, reqStr } from "../validate.ts";
import { paidCall } from "./credits.ts";
import { notify } from "./notifications.ts";
import { computeProgress } from "./progress.ts";
import { requireUser } from "./users.ts";

const SEVERITIES = ["low", "medium", "high", "blocker"] as const;
const PNG_DATA_URL = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/;

export function listChat(db: Db, userId: string, scope: "coach" | "support"): ChatMessage[] {
  return all<{ id: string; role: string; text: string; at: string }>(
    db,
    "SELECT id, role, text, at FROM chat_messages WHERE user_id = ? AND scope = ? ORDER BY rowid",
    [userId, scope],
  ).map((r) => ({ id: r.id, role: r.role as ChatMessage["role"], text: r.text, at: r.at }));
}

function appendChat(db: Db, userId: string, scope: "coach" | "support", message: ChatMessage): void {
  run(db, "INSERT INTO chat_messages (id, user_id, scope, role, text, at) VALUES (?, ?, ?, ?, ?, ?)", [
    message.id,
    userId,
    scope,
    message.role,
    message.text,
    message.at,
  ]);
}

function chatMessage(role: ChatMessage["role"], text: string): ChatMessage {
  return { id: uid(), role, text, at: nowIso() };
}

function progressSummary(core: Core, userId: string): string {
  const p = computeProgress(core, userId);
  return `Level ${p.level} with ${p.xp} XP, ${p.completedScenarios} project(s) completed, ${p.streak.current}-day streak.`;
}

export async function coachChat(core: Core, userId: string, body: unknown): Promise<{ reply: ChatMessage; history: ChatMessage[] }> {
  const message = reqStr(asObject(body), "message", { max: 2000 });
  const user = requireUser(core.db, userId);
  const history = listChat(core.db, userId, "coach");
  const text = await paidCall(core, userId, "coach_chat", () =>
    core.ai.coachReply({ user, history, message, progressSummary: progressSummary(core, userId) }),
  );
  const learnerMessage = chatMessage("learner", message);
  const reply = chatMessage("npc", text);
  appendChat(core.db, userId, "coach", learnerMessage);
  appendChat(core.db, userId, "coach", reply);
  return { reply, history: listChat(core.db, userId, "coach") };
}

export function coachHistory(db: Db, userId: string): ChatMessage[] {
  return listChat(db, userId, "coach");
}

export async function supportMessage(core: Core, userId: string, body: unknown): Promise<ChatMessage[]> {
  const text = reqStr(asObject(body), "text", { max: 2000 });
  const user = requireUser(core.db, userId);
  const history = listChat(core.db, userId, "support");
  const answer = await core.ai.supportReply({ user, history, message: text });
  appendChat(core.db, userId, "support", chatMessage("learner", text));
  appendChat(core.db, userId, "support", chatMessage("npc", answer));
  return listChat(core.db, userId, "support");
}

export function fileBugReport(core: Core, userId: string, body: unknown): { id: string } {
  const o = asObject(body);
  const input: BugReportInput = {
    title: reqStr(o, "title", { max: 200 }),
    description: reqStr(o, "description", { max: 5000 }),
    severity: reqEnum(o, "severity", SEVERITIES),
    feature: reqEnum(o, "feature", FEATURE_TAXONOMY),
  };
  const logs = optStr(o, "logs", { max: 20_000 });
  const screenshot = optStr(o, "screenshotDataUrl", { max: 8_000_000 });
  const id = uid();
  let screenshotFile: string | null = null;
  if (screenshot) {
    const match = PNG_DATA_URL.exec(screenshot);
    if (!match) throw badRequest("screenshotDataUrl must be a PNG data URL.");
    screenshotFile = `${id}.png`;
    writeFileSync(join(core.paths.screenshotsDir, screenshotFile), Buffer.from(match[1] ?? "", "base64"));
  }
  try {
    run(
      core.db,
      "INSERT INTO bug_reports (id, user_id, title, description, severity, feature, screenshot_file, logs, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, userId, input.title, input.description, input.severity, input.feature, screenshotFile, logs ?? null, nowIso()],
    );
  } catch (err) {
    if (screenshotFile) unlinkSync(join(core.paths.screenshotsDir, screenshotFile));
    throw err;
  }
  notify(core, userId, { category: "product", title: "Bug report received", body: `Thanks. Report ${id.slice(0, 8)} is with the team.` });
  return { id };
}
