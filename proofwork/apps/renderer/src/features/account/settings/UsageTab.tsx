import { useEffect } from "react";
import { CREDIT_CATEGORIES, type CreditsSummary } from "@pw/shared";
import { DotMeter, ProgressBar } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Feedback";
import { useCredits } from "@/stores/credits";
import { cn } from "@/lib/cn";
import { CREDIT_LABEL, formatCredits, signedCredits } from "../lib/labels";
import { layoutSpendBars, shortDayLabel } from "../lib/spendChart";
import { SettingsGroup, SettingsSection } from "../ui";

export function UsageTab() {
  const data = useCredits((s) => s.data);
  const loading = useCredits((s) => s.loading);
  const error = useCredits((s) => s.error);

  useEffect(() => {
    void useCredits.getState().refresh();
  }, []);

  if (!data) {
    if (error) {
      return (
        <p role="alert" className="text-[14px] text-danger">
          Could not load usage. {error}
        </p>
      );
    }
    return <Skeleton className="h-64" />;
  }

  return (
    <div className="flex flex-col gap-8">
      <BalanceCard data={data} loading={loading} />

      <SettingsSection title="Usage by category" description="Credits spent this billing period.">
        <SettingsGroup>
          <CategoryBars data={data} />
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="Last 14 days" description="Credits spent per day.">
        <SettingsGroup>
          <SpendChart daily={data.daily} />
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="Recent activity">
        <SettingsGroup className="p-0">
          {data.recent.length === 0 ? (
            <p className="p-5 text-[14px] text-fg-muted">No activity yet.</p>
          ) : (
            <ul className="max-h-[260px] divide-y divide-line overflow-y-auto">
              {data.recent.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] text-fg">{entry.reason}</div>
                    <div className="font-mono text-[11px] tracking-[0.06em] text-fg-muted uppercase">
                      {CREDIT_LABEL[entry.category]} · {shortDayLabel(entry.createdAt)}
                    </div>
                  </div>
                  <span
                    className={cn("shrink-0 font-mono text-[13px]", entry.delta > 0 ? "text-success" : "text-fg")}
                  >
                    {signedCredits(entry.delta)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SettingsGroup>
      </SettingsSection>
    </div>
  );
}

function BalanceCard({ data, loading }: { data: CreditsSummary; loading: boolean }) {
  const unlimited = data.balance === null;
  const allowance = data.allowance ?? 0;
  const ratio = !unlimited && allowance > 0 ? Math.min(1, (data.balance ?? 0) / allowance) : 0;

  return (
    <SettingsGroup>
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="font-mono text-[11px] tracking-[0.08em] text-fg-muted uppercase">Balance</div>
          <div className="mt-1 font-serif text-[52px] leading-none text-fg" aria-live="polite">
            {unlimited ? "Unlimited" : formatCredits(data.balance ?? 0)}
          </div>
          <div className="mt-2 text-[13px] text-fg-muted">
            {unlimited ? "Fair-use plan. No monthly cap." : `of ${formatCredits(allowance)} credits allowance`}
            {loading && " · updating"}
          </div>
        </div>
        {!unlimited && allowance > 0 && (
          <DotMeter value={ratio * 10} max={10} label={`${Math.round(ratio * 100)} percent of allowance left`} />
        )}
      </div>
    </SettingsGroup>
  );
}

function CategoryBars({ data }: { data: CreditsSummary }) {
  const values = CREDIT_CATEGORIES.map((c) => ({ id: c, value: data.usageByCategory[c] ?? 0 }));
  const max = values.reduce((m, v) => Math.max(m, v.value), 0);
  return (
    <ul className="flex flex-col gap-3">
      {values.map((v) => (
        <li key={v.id} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-fg">{CREDIT_LABEL[v.id]}</span>
            <span className="font-mono text-fg-muted">{formatCredits(v.value)}</span>
          </div>
          <ProgressBar value={max > 0 ? v.value / max : 0} label={`${CREDIT_LABEL[v.id]} usage`} />
        </li>
      ))}
    </ul>
  );
}

const CHART_W = 560;
const CHART_H = 150;
const LABEL_H = 18;

/** 14-day spend as SVG bars. Scaling lives in lib/spendChart.ts. */
function SpendChart({ daily }: { daily: CreditsSummary["daily"] }) {
  if (daily.length === 0) return <p className="text-[14px] text-fg-muted">No spend in the last 14 days.</p>;
  const bars = layoutSpendBars(daily, { width: CHART_W, height: CHART_H - LABEL_H, gap: 6 });
  const total = daily.reduce((s, d) => s + d.spent, 0);
  const first = bars[0];
  const last = bars[bars.length - 1];

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      role="img"
      aria-label={`Spend over ${daily.length} days, ${formatCredits(total)} credits in total`}
      className="h-auto w-full"
    >
      <line x1={0} x2={CHART_W} y1={CHART_H - LABEL_H} y2={CHART_H - LABEL_H} className="stroke-line" strokeWidth={1} />
      {bars.map((b) => (
        <rect
          key={b.date}
          x={b.x}
          y={b.y}
          width={b.width}
          height={b.height}
          rx={3}
          className="fill-accent/80"
        >
          <title>{`${shortDayLabel(b.date)}: ${formatCredits(b.spent)} credits`}</title>
        </rect>
      ))}
      <text x={first.x} y={CHART_H - 3} fontSize={11} className="fill-fg-muted">
        {shortDayLabel(first.date)}
      </text>
      <text x={last.x + last.width} y={CHART_H - 3} fontSize={11} textAnchor="end" className="fill-fg-muted">
        {shortDayLabel(last.date)}
      </text>
    </svg>
  );
}
