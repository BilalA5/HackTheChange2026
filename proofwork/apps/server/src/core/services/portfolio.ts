// Portfolio: projects from completed objectives, skills, shareable slug and editable headline/bio.
import type { Objective, Portfolio, PortfolioProject } from "@pw/shared";
import { one, run, type Db } from "../db.ts";
import { badRequest } from "../errors.ts";
import type { Core } from "../types.ts";
import { asObject, optStr } from "../validate.ts";
import { contentFor } from "../user-content.ts";
import { completedObjectives } from "./objective-store.ts";
import { latestEvaluation } from "./performance.ts";
import { nowIso } from "../util.ts";
import { randomBytes } from "node:crypto";

export const PORTFOLIO_UNLOCK_SCENARIOS = 1;

interface PortfolioRow {
  share_slug: string;
  headline: string;
  bio: string;
}

function ensurePortfolioRow(db: Db, userId: string): PortfolioRow {
  run(db, "INSERT OR IGNORE INTO portfolios (user_id, share_slug) VALUES (?, ?)", [userId, randomBytes(9).toString("base64url")]);
  const row = one<PortfolioRow>(db, "SELECT share_slug, headline, bio FROM portfolios WHERE user_id = ?", [userId]);
  if (!row) throw new Error("Portfolio row missing after insert.");
  return row;
}

export function projectFor(core: Core, userId: string, obj: Objective): PortfolioProject {
  const content = contentFor(core, userId);
  const scenario = content.getScenario(obj.scenarioId);
  const company = scenario ? content.getCompany(scenario.companyId) : undefined;
  const last = latestEvaluation(obj);
  return {
    scenarioId: obj.scenarioId,
    title: scenario?.title ?? obj.scenarioId,
    company: company?.name ?? "",
    summary: last?.summary ?? "",
    overall: last?.overall ?? "meeting",
    xp: obj.xpEarned,
    completedAt: obj.completedAt ?? nowIso(),
  };
}

export function getPortfolio(core: Core, userId: string): Portfolio {
  const row = ensurePortfolioRow(core.db, userId);
  const completed = completedObjectives(core.db, userId);
  const content = contentFor(core, userId);
  const skills: string[] = [];
  for (const obj of completed) {
    for (const skill of content.getScenario(obj.scenarioId)?.skills ?? []) {
      if (!skills.includes(skill)) skills.push(skill);
    }
  }
  return {
    headline: row.headline,
    bio: row.bio,
    skills,
    projects: completed.map((obj) => projectFor(core, userId, obj)),
    shareSlug: row.share_slug,
    unlocked: completed.length >= PORTFOLIO_UNLOCK_SCENARIOS,
  };
}

export function updatePortfolio(core: Core, userId: string, body: unknown): Portfolio {
  const o = asObject(body);
  const headline = optStr(o, "headline", { max: 120 });
  const bio = optStr(o, "bio", { max: 2000 });
  if (headline === undefined && bio === undefined) throw badRequest("Send headline and/or bio.");
  ensurePortfolioRow(core.db, userId);
  if (headline !== undefined) run(core.db, "UPDATE portfolios SET headline = ? WHERE user_id = ?", [headline, userId]);
  if (bio !== undefined) run(core.db, "UPDATE portfolios SET bio = ? WHERE user_id = ?", [bio, userId]);
  return getPortfolio(core, userId);
}

export function savePortfolioCopy(db: Db, userId: string, headline: string, bio: string): void {
  ensurePortfolioRow(db, userId);
  run(db, "UPDATE portfolios SET headline = ?, bio = ? WHERE user_id = ?", [headline, bio, userId]);
}
