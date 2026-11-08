import type { CreditCategory, NotificationCategory } from "@pw/shared";

export const CREDIT_LABEL: Record<CreditCategory | "grant", string> = {
  evaluation: "Evaluation",
  training: "Training",
  ai_manager: "AI Manager",
  coaching: "Coaching",
  other: "Other",
  grant: "Grant",
};

export const NOTIFICATION_LABEL: Record<NotificationCategory, string> = {
  progress: "Progress",
  feedback: "Feedback",
  manager: "Manager messages",
  coaching: "Coaching tips",
  jobs: "Jobs",
  billing: "Billing",
  product: "Product updates",
};

export function formatCredits(n: number): string {
  return n.toLocaleString("en-US");
}

/** Signed credit delta for ledger rows, e.g. "+10,000" or "-40". */
export function signedCredits(delta: number): string {
  return `${delta > 0 ? "+" : ""}${formatCredits(delta)}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function planPriceLabel(priceUsdMonthly: number, oneTime: boolean): string {
  if (priceUsdMonthly === 0) return "Free";
  return `$${priceUsdMonthly}${oneTime ? "" : "/mo"}`;
}
