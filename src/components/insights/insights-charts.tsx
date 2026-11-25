import Link from "next/link";
import { CalendarDays, Store, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import type { CategoryTotal, MerchantTotal, WeekdayTotal } from "@/lib/analytics";
import { monthLabel } from "@/lib/dates";
import { formatMoney, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export type RangeOption = "3m" | "6m" | "12m";

export function RangeSwitcher({ range }: { range: RangeOption }) {
  const options: { value: RangeOption; label: string }[] = [
    { value: "3m", label: "3M" },
    { value: "6m", label: "6M" },
    { value: "12m", label: "12M" },
  ];

  return (
    <div
      className="inline-flex items-center gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1"
      role="group"
      aria-label="Time range"
    >
      {options.map((option) => {
        const active = option.value === range;
        return (
          <Link
            key={option.value}
            href={`/insights?range=${option.value}`}
            className={cn(
              "rounded-xl px-3 py-1.5 text-[12px] font-medium transition-colors",
              active
                ? "bg-brand text-[#101408] shadow-[0_6px_18px_-6px_rgba(205,245,107,0.6)]"
                : "text-muted hover:text-white",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}

export function MonthlyCashflowCard({
  series,
  currency,
}: {
  series: { month: string; expenses: number; income: number; count: number }[];
  currency: string;
}) {
  const maxVal = Math.max(
    1,
    ...series.flatMap((entry) => [entry.expenses, entry.income]),
  );
  const hasData = series.some((entry) => entry.expenses > 0 || entry.income > 0);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.15em] text-muted">Cashflow</p>
          <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-white">Month by month</h2>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-coral" /> Spent
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-mint" /> Income
          </span>
        </div>
      </div>

      {!hasData ? (
        <div className="mt-5 flex h-48 items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.012]">
          <p className="text-[12px] text-muted">No transactions recorded in this window yet.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6 lg:gap-4" style={{ gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))` }}>
          {series.map((entry) => {
            const expenseHeight = Math.max(entry.expenses > 0 ? 6 : 0, Math.round((entry.expenses / maxVal) * 140));
            const incomeHeight = Math.max(entry.income > 0 ? 6 : 0, Math.round((entry.income / maxVal) * 140));
            const shortMonth = monthLabel(entry.month, "short").split(" ")[0];

            return (
              <div key={entry.month} className="flex flex-col items-center">
                <div className="flex h-[148px] w-full items-end justify-center gap-1.5 border-b border-white/[0.06] pb-2">
                  <div
                    title={`Spent: ${formatMoney(entry.expenses, currency)}`}
                    className="w-3 rounded-t-md bg-coral/85 transition-all sm:w-4"
                    style={{ height: `${expenseHeight}px` }}
                  />
                  <div
                    title={`Income: ${formatMoney(entry.income, currency)}`}
                    className="w-3 rounded-t-md bg-mint/80 transition-all sm:w-4"
                    style={{ height: `${incomeHeight}px` }}
                  />
                </div>
                <span className="mt-2 text-[11px] font-medium text-muted">{shortMonth}</span>
                <span className="num text-[10px] text-muted/70">
                  {formatMoney(entry.expenses, currency, { compact: true })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function WeekdaySpendCard({
  weekdays,
  currency,
}: {
  weekdays: WeekdayTotal[];
  currency: string;
}) {
  const maxVal = Math.max(1, ...weekdays.map((day) => day.amount));
  const peak = weekdays.slice().sort((a, b) => b.amount - a.amount)[0];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.15em] text-muted">Rhythm</p>
          <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-white">Spending by weekday</h2>
        </div>
        <span className="grid size-8 place-items-center rounded-xl bg-brand/10 text-brand">
          <CalendarDays size={15} />
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {weekdays.map((day) => {
          const width = day.amount > 0 ? Math.max(4, (day.amount / maxVal) * 100) : 0;
          const isPeak = peak && peak.amount > 0 && peak.day === day.day;
          return (
            <div key={day.day} className="grid grid-cols-[36px_1fr_auto] items-center gap-3">
              <span className={cn("text-[12px] font-medium", isPeak ? "text-brand" : "text-muted")}>
                {day.day}
              </span>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={cn("h-full rounded-full", isPeak ? "bg-brand" : "bg-white/30")}
                  style={{ width: `${width}%` }}
                />
              </div>
              <span className="num text-[12px] text-white">
                {formatMoney(day.amount, currency, { compact: day.amount >= 100_000 })}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function TopMerchantsCard({
  merchants,
  currency,
}: {
  merchants: MerchantTotal[];
  currency: string;
}) {
  const maxVal = Math.max(1, ...merchants.map((merchant) => merchant.amount));

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.15em] text-muted">Where it goes</p>
          <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-white">Top merchants</h2>
        </div>
        <span className="grid size-8 place-items-center rounded-xl bg-coral/10 text-coral">
          <Store size={15} />
        </span>
      </div>

      {merchants.length === 0 ? (
        <p className="mt-6 text-[12.5px] text-muted">No expenses in this period yet.</p>
      ) : (
        <div className="mt-5 space-y-3.5">
          {merchants.map((merchant) => (
            <div key={merchant.name}>
              <div className="flex items-center justify-between gap-2 text-[12.5px]">
                <span className="truncate font-medium text-white">{merchant.name}</span>
                <span className="num shrink-0 font-medium text-white">
                  {formatMoney(merchant.amount, currency)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-coral/80"
                    style={{ width: `${Math.max(4, (merchant.amount / maxVal) * 100)}%` }}
                  />
                </div>
                <span className="num text-[10.5px] text-muted">
                  {merchant.count} {merchant.count === 1 ? "entry" : "entries"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function TopCategoriesCard({
  categories,
  currency,
}: {
  categories: CategoryTotal[];
  currency: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.15em] text-muted">Breakdown</p>
          <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-white">Categories in range</h2>
        </div>
        <span className="grid size-8 place-items-center rounded-xl bg-mint/10 text-mint">
          <TrendingUp size={15} />
        </span>
      </div>

      {categories.length === 0 ? (
        <p className="mt-6 text-[12.5px] text-muted">No categorized spending in this range yet.</p>
      ) : (
        <div className="mt-5 space-y-3">
          {categories.slice(0, 7).map((category) => (
            <div key={category.id} className="flex items-center gap-3">
              <CategoryIcon categoryId={category.id} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-[12.5px]">
                  <span className="truncate font-medium text-white">{category.label}</span>
                  <span className="num shrink-0 text-white">{formatMoney(category.amount, currency)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(3, category.share * 100)}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>
                  <span className="num text-[10.5px] text-muted">{formatPercent(category.share)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

