import Link from "next/link";
import { ArrowUpRight, CircleDashed, Target } from "lucide-react";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { CategoryIcon } from "@/components/ui/category-icon";
import type { BudgetSummary, CategoryTotal } from "@/lib/analytics";
import { formatMoney, formatPercent } from "@/lib/format";

export function CategoryCard({
  categories,
  total,
  currency,
}: {
  categories: CategoryTotal[];
  total: number;
  currency: string;
}) {
  const top = categories.slice(0, 5);
  const rest = categories.slice(5);
  const display: CategoryTotal[] = [...top];

  if (rest.length > 0) {
    const restTotal = rest.reduce((sum, item) => sum + item.amount, 0);
    display.push({
      id: "everything-else",
      label: "Everything else",
      color: "#5B6270",
      amount: restTotal,
      count: rest.reduce((sum, item) => sum + item.count, 0),
      share: total > 0 ? restTotal / total : 0,
    });
  }

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.15em] text-muted">By category</p>
          <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-white">Where it went</h2>
        </div>
        <Link
          href="/insights"
          className="inline-flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-white"
        >
          Insights <ArrowUpRight size={12} />
        </Link>
      </div>

      {total > 0 ? (
        <div className="mt-4 flex flex-1 flex-col items-center gap-5 sm:flex-row">
          <DonutChart categories={display} total={total} currency={currency} />
          <div className="w-full flex-1 space-y-2.5">
            {display.map((category) => (
              <div key={category.id} className="flex items-center gap-2.5">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                <span className="min-w-0 flex-1 truncate text-[11.5px] text-muted">{category.label}</span>
                <span className="num text-[11px] font-medium text-white">{formatMoney(category.amount, currency)}</span>
                <span className="num w-8 text-right text-[10px] text-muted/70">{formatPercent(category.share)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <span className="grid size-12 place-items-center rounded-full border border-dashed border-white/[0.12] text-muted/70">
            <CircleDashed size={20} />
          </span>
          <p className="mt-3 text-[12.5px] text-muted">No spending to break down yet.</p>
          <Link href="/transactions" className="mt-2 text-[11.5px] font-medium text-brand hover:underline">
            Add your first expense
          </Link>
        </div>
      )}
    </Card>
  );
}

export function BudgetPulseCard({
  summary,
  currency,
}: {
  summary: BudgetSummary;
  currency: string;
}) {
  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.15em] text-muted">Monthly limits</p>
          <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-white">Budget pulse</h2>
        </div>
        <Link
          href="/budgets"
          className="inline-flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-white"
        >
          Manage <ArrowUpRight size={12} />
        </Link>
      </div>

      {summary.totalBudget > 0 ? (
        <>
          <div className="mt-5 rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="num text-[19px] font-semibold tracking-tight text-white">
                  {formatMoney(summary.totalSpent, currency)}
                </p>
                <p className="mt-0.5 text-[10.5px] text-muted">
                  of {formatMoney(summary.totalBudget, currency)} budgeted
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                  summary.totalRemaining < 0
                    ? "bg-coral/[0.1] text-coral"
                    : "bg-brand/[0.09] text-brand"
                }`}
              >
                {summary.totalRemaining < 0
                  ? `${formatMoney(Math.abs(summary.totalRemaining), currency)} over`
                  : `${formatMoney(summary.totalRemaining, currency)} left`}
              </span>
            </div>
            <ProgressBar
              ratio={summary.ratio}
              over={summary.totalRemaining < 0}
              className="mt-3"
            />
            <div className="mt-2 flex items-center justify-between text-[10px] text-muted/70">
              <span>{formatPercent(summary.ratio)} used</span>
              <span>
                {summary.overCount > 0
                  ? `${summary.overCount} categor${summary.overCount === 1 ? "y" : "ies"} over`
                  : "All categories on track"}
              </span>
            </div>
          </div>

          <div className="mt-4 flex-1 space-y-3">
            {summary.items.slice(0, 4).map((item) => (
              <div key={item.id}>
                <div className="flex items-center gap-2">
                  <CategoryIcon categoryId={item.category} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-[11.5px] text-white">{item.label}</span>
                  <span className="num text-[10.5px] text-muted">
                    <span className={item.remaining < 0 ? "text-coral" : "text-white/85"}>
                      {formatMoney(item.spent, currency)}
                    </span>{" "}
                    / {formatMoney(item.budget, currency)}
                  </span>
                </div>
                <ProgressBar
                  ratio={item.ratio}
                  color={item.color}
                  over={item.remaining < 0}
                  className="mt-1.5 h-1"
                />
              </div>
            ))}
          </div>

          {summary.items.length > 4 ? (
            <Link
              href="/budgets"
              className="mt-4 block border-t border-white/[0.055] pt-3 text-center text-[11px] text-muted transition-colors hover:text-white"
            >
              View all {summary.items.length} budgets
            </Link>
          ) : null}
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <span className="grid size-12 place-items-center rounded-full border border-dashed border-white/[0.12] text-muted/70">
            <Target size={20} />
          </span>
          <p className="mt-3 max-w-[240px] text-[12.5px] leading-relaxed text-muted">
            Set a few monthly limits and we&apos;ll keep an eye on the pace for both of you.
          </p>
          <Link
            href="/budgets"
            className="mt-4 inline-flex h-9 items-center rounded-xl bg-white/[0.055] px-3.5 text-[12px] font-medium text-white transition-colors hover:bg-white/[0.09]"
          >
            Set up budgets
          </Link>
        </div>
      )}
    </Card>
  );
}
