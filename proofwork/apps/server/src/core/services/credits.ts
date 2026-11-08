// Credit ledger: debits for AI actions, grants, plan changes and usage summaries.
import {
  CREDIT_CATEGORIES,
  CREDIT_COSTS,
  PLANS,
  type CreditAction,
  type CreditCategory,
  type CreditsSummary,
  type LedgerEntry,
  type PlanId,
} from "@pw/shared";
import { all, one, run } from "../db.ts";
import { badRequest, insufficientCredits } from "../errors.ts";
import type { Core } from "../types.ts";
import { addDaysIso, nowIso, shiftDay, todayUtc, uid } from "../util.ts";
import { notify } from "./notifications.ts";
import { planChangedAt, planOf, requireUser, setPlan } from "./users.ts";

export interface DebitResult {
  ok: boolean;
  balance: number | null;
}

function writeLedger(core: Core, userId: string, delta: number, category: string, reason: string, expiresAt: string | null = null): void {
  run(
    core.db,
    "INSERT INTO ledger (id, user_id, delta, category, reason, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [uid(), userId, delta, category, reason, nowIso(), expiresAt],
  );
}

export function balanceOf(core: Core, userId: string): number {
  const row = one<{ total: number }>(core.db, "SELECT COALESCE(SUM(delta), 0) AS total FROM ledger WHERE user_id = ?", [userId]);
  return Number(row?.total ?? 0);
}

function currentBalance(core: Core, userId: string): number | null {
  return planOf(core.db, userId) === "unlimited" ? null : balanceOf(core, userId);
}

function pushBalance(core: Core, userId: string): void {
  core.hub.push(userId, { type: "credits", balance: currentBalance(core, userId) });
}

/** Debits an AI action. Nothing is written when the balance is insufficient. */
export function debit(core: Core, userId: string, action: CreditAction, reason?: string): DebitResult {
  const cost = CREDIT_COSTS[action];
  const label = reason ?? `Used ${action.replace(/_/g, " ")}`;
  if (planOf(core.db, userId) === "unlimited") {
    writeLedger(core, userId, -cost.amount, cost.category, label);
    pushBalance(core, userId);
    return { ok: true, balance: null };
  }
  const balance = balanceOf(core, userId);
  if (balance < cost.amount) return { ok: false, balance };
  writeLedger(core, userId, -cost.amount, cost.category, label);
  pushBalance(core, userId);
  return { ok: true, balance: balance - cost.amount };
}

/** Gives back a debit for an AI call that failed. */
export function refund(core: Core, userId: string, action: CreditAction): void {
  const cost = CREDIT_COSTS[action];
  writeLedger(core, userId, cost.amount, cost.category, `Refund: ${action.replace(/_/g, " ")}`);
  pushBalance(core, userId);
}

/** Runs an AI call behind a debit; refunds the debit if the call throws. */
export async function paidCall<T>(core: Core, userId: string, action: CreditAction, fn: () => Promise<T>): Promise<T> {
  const charge = debit(core, userId, action);
  if (!charge.ok) throw insufficientCredits();
  try {
    return await fn();
  } catch (err) {
    refund(core, userId, action);
    throw err;
  }
}

export function grant(core: Core, userId: string, amount: number, reason: string, expiresAt: string | null = null): void {
  writeLedger(core, userId, amount, "grant", reason, expiresAt);
  pushBalance(core, userId);
}

export function creditsSummary(core: Core, userId: string): CreditsSummary {
  const user = requireUser(core.db, userId);
  const plan = user.plan;
  const info = PLANS.find((p) => p.id === plan);
  const changed = planChangedAt(core.db, userId);

  const usageByCategory = Object.fromEntries(CREDIT_CATEGORIES.map((c) => [c, 0])) as Record<CreditCategory, number>;
  const usageRows = all<{ category: string; total: number }>(
    core.db,
    "SELECT category, -SUM(delta) AS total FROM ledger WHERE user_id = ? AND delta < 0 GROUP BY category",
    [userId],
  );
  for (const row of usageRows) {
    if ((CREDIT_CATEGORIES as readonly string[]).includes(row.category)) {
      usageByCategory[row.category as CreditCategory] = Number(row.total);
    }
  }

  const today = todayUtc();
  const startDay = shiftDay(today, -13);
  const spendRows = all<{ created_at: string; delta: number }>(
    core.db,
    "SELECT created_at, delta FROM ledger WHERE user_id = ? AND delta < 0 AND created_at >= ?",
    [userId, `${startDay}T00:00:00.000Z`],
  );
  const daily: { date: string; spent: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const date = shiftDay(startDay, i);
    const spent = spendRows.filter((r) => r.created_at.slice(0, 10) === date).reduce((sum, r) => sum + -r.delta, 0);
    daily.push({ date, spent });
  }

  const recentRows = all<{ id: string; delta: number; category: string; reason: string; created_at: string }>(
    core.db,
    "SELECT id, delta, category, reason, created_at FROM ledger WHERE user_id = ? ORDER BY rowid DESC LIMIT 20",
    [userId],
  );
  const recent: LedgerEntry[] = recentRows.map((r) => ({
    id: r.id,
    delta: r.delta,
    category: r.category as LedgerEntry["category"],
    reason: r.reason,
    createdAt: r.created_at,
  }));

  return {
    plan,
    balance: currentBalance(core, userId),
    allowance: info?.credits ?? null,
    renewsAt: plan === "free" ? null : addDaysIso(changed ?? user.createdAt, 30),
    expiresAt: plan === "free" ? addDaysIso(user.createdAt, 30) : null,
    usageByCategory,
    daily,
    recent,
  };
}

export function changePlan(core: Core, userId: string, plan: string): CreditsSummary {
  const info = PLANS.find((p) => p.id === plan);
  if (!info) throw badRequest("Unknown plan.");
  setPlan(core.db, userId, info.id as PlanId, nowIso());
  if (info.id === "pro") grant(core, userId, info.credits ?? 0, "Pro monthly credits");
  notify(core, userId, {
    category: "billing",
    title: "Plan updated",
    body: `You are now on ${info.name}. This is a simulated change, so no payment was taken.`,
  });
  return creditsSummary(core, userId);
}

export function topUp(core: Core, userId: string, amount: number): CreditsSummary {
  grant(core, userId, amount, "Credit top-up");
  return creditsSummary(core, userId);
}
