import { useEffect, useRef } from "react";
import { CREDIT_CATEGORIES, PLANS } from "@pw/shared";
import { Popover } from "@/components/ui/Popover";
import { Button } from "@/components/ui/Button";
import { DotMeter } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Feedback";
import { useCredits } from "@/stores/credits";
import { useUi, type PanelProps } from "@/stores/ui";
import { CREDIT_LABEL, formatCredits, formatDate } from "./lib/labels";
import { MonoLabel } from "@/components/ui/Labels";

/** Balance popover anchored under the titlebar credits pill (top right). Closes on outside click and Esc. */
export default function CreditsPopover({ onClose }: PanelProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const data = useCredits((s) => s.data);
  const loading = useCredits((s) => s.loading);
  const error = useCredits((s) => s.error);

  useEffect(() => {
    void useCredits.getState().refresh();
  }, []);

  const planName = data ? (PLANS.find((p) => p.id === data.plan)?.name ?? data.plan) : "";
  const unlimited = data?.balance === null;
  const allowance = data?.allowance ?? 0;
  const ratio = data && !unlimited && allowance > 0 ? Math.min(1, (data.balance ?? 0) / allowance) : 0;

  let dateLine: string | null = null;
  if (data) {
    if (unlimited) dateLine = "Fair-use plan";
    else if (data.plan === "free" && data.expiresAt) dateLine = `Expires ${formatDate(data.expiresAt)}`;
    else if (data.renewsAt) dateLine = `Renews ${formatDate(data.renewsAt)}`;
  }

  const openBilling = () => useUi.getState().openPanel("settings", { initialTab: "billing" });

  return (
    <>
      {/* Invisible anchor at the titlebar's right edge, where the credits pill sits. */}
      <span ref={anchorRef} aria-hidden="true" className="pointer-events-none fixed top-[44px] right-4 h-px w-px" />
      <Popover open onClose={onClose} anchorRef={anchorRef} placement="bottom-end" label="Credits" width={340}>
        {!data && error && (
          <div role="alert" className="flex flex-col gap-3 text-[14px] text-danger">
            <span>Could not load credits. {error}</span>
            <Button variant="glass" size="sm" onClick={() => void useCredits.getState().refresh()}>
              Try again
            </Button>
          </div>
        )}
        {!data && !error && <Skeleton className="h-36" />}
        {data && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <MonoLabel>Credits</MonoLabel>
              <span className="rounded-full bg-accent/15 px-3 py-1 text-[12px] font-medium text-accent">{planName}</span>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="font-serif text-[40px] leading-none text-fg" aria-live="polite">
                  {unlimited ? "Unlimited" : formatCredits(data.balance ?? 0)}
                </div>
                <div className="mt-1 text-[12px] text-fg-muted">
                  {unlimited ? "Fair-use allowance" : allowance > 0 ? `of ${formatCredits(allowance)} credits` : "credits"}
                </div>
              </div>
              {!unlimited && allowance > 0 && (
                <DotMeter value={ratio * 10} max={10} label={`${Math.round(ratio * 100)} percent of allowance left`} />
              )}
            </div>

            {dateLine && <div className="text-[12px] text-fg-muted">{dateLine}</div>}

            <div className="flex flex-col gap-2 border-t border-line pt-3">
              <MonoLabel>Used this period</MonoLabel>
              <ul className="flex flex-col gap-1.5">
                {CREDIT_CATEGORIES.map((c) => (
                  <li key={c} className="flex items-center justify-between text-[13px]">
                    <span className="text-fg-muted">{CREDIT_LABEL[c]}</span>
                    <span className="font-mono text-fg">{formatCredits(data.usageByCategory[c] ?? 0)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button variant="glass" size="sm" className="w-full" onClick={openBilling}>
              Manage plan
            </Button>
          </div>
        )}
        {loading && data && <span className="sr-only">Updating credits</span>}
      </Popover>
    </>
  );
}
