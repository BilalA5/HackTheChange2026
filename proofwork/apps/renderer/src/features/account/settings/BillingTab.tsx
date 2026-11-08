import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { PlanId, PlanInfo } from "@pw/shared";
import { api, useApi } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { toast } from "@/components/ui/Toaster";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Labels";
import { Skeleton } from "@/components/ui/Feedback";
import { useCredits } from "@/stores/credits";
import { useSession } from "@/stores/session";
import { cn } from "@/lib/cn";
import { formatCredits, planPriceLabel } from "../lib/labels";
import { InlineConfirm, SettingsGroup, SettingsSection } from "../ui";

const TOPUP_AMOUNTS = [1_000, 5_000, 10_000] as const;

export function BillingTab() {
  const user = useSession((s) => s.user);
  const credits = useCredits((s) => s.data);
  const plans = useApi("GET /plans", {}, []);
  const [pendingPlan, setPendingPlan] = useState<PlanInfo | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void useCredits.getState().refresh();
  }, []);

  const currentPlan: PlanId | undefined = credits?.plan ?? user?.plan;

  const runAction = async (key: string, action: () => Promise<unknown>, done: string) => {
    setBusy(key);
    setError(null);
    try {
      await action();
      await useCredits.getState().refresh();
      await useSession.getState().refreshUser().catch(() => undefined);
      toast({ title: done, tone: "success" });
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const switchPlan = async (plan: PlanInfo) => {
    const ok = await runAction("plan", () => api("POST /credits/plan", { body: { plan: plan.id } }), `Plan changed to ${plan.name}`);
    if (ok) setPendingPlan(null);
  };

  return (
    <div className="flex flex-col gap-8">
      <SettingsSection title="Plans" description="Pick the plan that fits how much you practise.">
        {plans.loading && !plans.data && <Skeleton className="h-60" />}
        {plans.error && (
          <div role="alert" className="flex items-center justify-between gap-3 text-[14px] text-danger">
            <span>Could not load plans.</span>
            <Button variant="glass" size="sm" onClick={() => plans.reload()}>
              Try again
            </Button>
          </div>
        )}
        {plans.data && (
          <div className="grid grid-cols-3 gap-3">
            {plans.data.map((plan) => {
              const isCurrent = plan.id === currentPlan;
              return (
                <article
                  key={plan.id}
                  aria-label={plan.name}
                  className={cn(
                    "flex flex-col gap-4 rounded-card border p-5",
                    isCurrent ? "border-accent bg-accent/10" : "border-line bg-white/4",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-serif text-[18px] text-fg">{plan.name}</h4>
                    {isCurrent && <Pill tone="accent" icon={<Check size={12} strokeWidth={1.75} />}>Current</Pill>}
                  </div>
                  <div>
                    <div className="font-serif text-[28px] leading-none text-fg">{planPriceLabel(plan.priceUsdMonthly, plan.oneTime)}</div>
                    <div className="mt-1 font-mono text-[12px] text-fg-muted">
                      {plan.credits === null ? "Fair-use unlimited" : `${formatCredits(plan.credits)} credits`}
                    </div>
                  </div>
                  <ul className="flex flex-1 flex-col gap-2 text-[13px] text-fg-muted">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-fg-muted" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button variant={isCurrent ? "glass" : "primary"} size="sm" disabled={isCurrent || busy !== null} onClick={() => setPendingPlan(plan)}>
                    {isCurrent ? "Current plan" : `Switch to ${plan.name}`}
                  </Button>
                </article>
              );
            })}
          </div>
        )}

        {pendingPlan && (
          <InlineConfirm
            title={`Switch to ${pendingPlan.name}?`}
            body="Simulated: no payment is taken in this build."
            confirmLabel={`Switch to ${pendingPlan.name}`}
            busy={busy === "plan"}
            onConfirm={() => void switchPlan(pendingPlan)}
            onCancel={() => setPendingPlan(null)}
          >
            {error && (
              <p role="alert" className="text-[13px] text-danger">
                {error}
              </p>
            )}
          </InlineConfirm>
        )}
      </SettingsSection>

      <SettingsSection title="Top up" description="Add credits to your balance. Simulated in this build.">
        <SettingsGroup>
          <div className="flex flex-wrap gap-2">
            {TOPUP_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                variant="glass"
                size="sm"
                loading={busy === `topup-${amount}`}
                disabled={busy !== null && busy !== `topup-${amount}`}
                onClick={() =>
                  void runAction(`topup-${amount}`, () => api("POST /credits/topup", { body: { amount } }), `Added ${formatCredits(amount)} credits`)
                }
              >
                +{formatCredits(amount)} credits
              </Button>
            ))}
          </div>
          {!pendingPlan && error && (
            <p role="alert" className="text-[13px] text-danger">
              {error}
            </p>
          )}
        </SettingsGroup>
      </SettingsSection>
    </div>
  );
}
