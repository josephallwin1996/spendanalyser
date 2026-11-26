import type { Metadata } from "next";
import { ArrowDownLeft, ArrowUpRight, Target, Users } from "lucide-react";
import { PageHeading } from "@/components/app-shell/page-heading";
import { RecentActivityCard, WhoPaidCard } from "@/components/dashboard/activity-cards";
import { DeltaChip, MetricCard } from "@/components/dashboard/metric-card";
import { BudgetPulseCard, CategoryCard } from "@/components/dashboard/overview-cards";
import { SpendTrendChart } from "@/components/dashboard/spend-trend-chart";
import { AddTransactionButton } from "@/components/transactions/transaction-dialog";
import { Card } from "@/components/ui/card";
import { MonthSwitcher } from "@/components/ui/month-switcher";
import {
  percentChange,
  summarizeBudgets,
  summarizeMonth,
} from "@/lib/analytics";
import { requireHousehold } from "@/lib/auth";
import { currentMonthKey, greeting, isValidMonth, monthLabel, shiftMonth } from "@/lib/dates";
import { getBudgets, getTransactionsForMonth } from "@/lib/data";
import { firstName, formatMoney, formatPercent } from "@/lib/format";

export const metadata: Metadata = {
  title: "Overview",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const { user, household, members } = await requireHousehold();
  const params = await searchParams;
  const monthParam = first(params.month);
  const month = monthParam && isValidMonth(monthParam) ? monthParam : currentMonthKey();
  const previousMonth = shiftMonth(month, -1);

  const [transactions, previousTransactions, budgets] = await Promise.all([
    getTransactionsForMonth(household.id, month),
    getTransactionsForMonth(household.id, previousMonth),
    getBudgets(household.id),
  ]);

  const summary = summarizeMonth(transactions, month, members);
  const previousSummary = summarizeMonth(previousTransactions, previousMonth, members);
  const budgetSummary = summarizeBudgets(transactions, budgets);
  const spendChange = percentChange(summary.expenses, previousSummary.expenses);
  const incomeChange = percentChange(summary.income, previousSummary.income);

  const previousAtSamePoint =
    previousSummary.daily[
      Math.min(summary.daily.length - 1, Math.max(0, previousSummary.daily.length - 1))
    ]?.cumulative ?? 0;
  const paceChange = percentChange(summary.expenses, previousAtSamePoint);
  const recent = transactions.slice(0, 6);
  const isCurrentMonth = month === currentMonthKey();

  return (
    <div>
      <PageHeading
        eyebrow="Overview"
        title={`${greeting()}, ${firstName(user.name)}`}
        description={
          isCurrentMonth
            ? `Here's how ${monthLabel(month)} is shaping up for the two of you.`
            : `A look back at ${monthLabel(month)} for the two of you.`
        }
        actions={
          <>
            <MonthSwitcher month={month} />
            <AddTransactionButton
              members={members}
              currency={household.currency}
              label="Add"
            />
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          className="animate-rise"
          label="Spent this month"
          value={formatMoney(summary.expenses, household.currency)}
          icon={ArrowUpRight}
          color="#FF8A70"
          glow
          footer={
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <DeltaChip value={spendChange} positiveIsGood={false} />
                <span>vs last month</span>
              </span>
              <span className="num ml-auto text-muted/80">
                {formatMoney(summary.averagePerDay, household.currency)}/day
              </span>
            </div>
          }
        />
        <MetricCard
          className="animate-rise stagger-1"
          label="Income this month"
          value={formatMoney(summary.income, household.currency)}
          icon={ArrowDownLeft}
          color="#63E6C1"
          footer={
            <div>
              <span className="inline-flex items-center gap-1.5">
                <DeltaChip value={incomeChange} positiveIsGood />
                <span>vs last month</span>
              </span>
              <p className="mt-1.5 text-muted/80">
                {summary.income > 0 ? (
                  <>
                    Net{" "}
                    <span className={summary.net >= 0 ? "text-mint" : "text-coral"}>
                      {formatMoney(summary.net, household.currency, { signed: true })}
                    </span>{" "}
                    this month
                  </>
                ) : (
                  "Add income to see your savings rate."
                )}
              </p>
            </div>
          }
        />
        <MetricCard
          className="animate-rise stagger-2"
          label="Budget left"
          value={
            budgetSummary.totalBudget > 0
              ? formatMoney(budgetSummary.totalRemaining, household.currency)
              : "—"
          }
          icon={Target}
          color="#CDF56B"
          footer={
            budgetSummary.totalBudget > 0 ? (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span>{formatPercent(budgetSummary.ratio)} of budget used</span>
                  {budgetSummary.overCount > 0 ? (
                    <span className="text-coral">{budgetSummary.overCount} over</span>
                  ) : null}
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(budgetSummary.ratio, 1) * 100}%`,
                      backgroundColor: budgetSummary.totalRemaining < 0 ? "#F87171" : "#CDF56B",
                    }}
                  />
                </div>
              </div>
            ) : (
              <span>
                No monthly budgets yet.{" "}
                <a href="/budgets" className="font-medium text-brand hover:underline">
                  Set them up
                </a>
              </span>
            )
          }
        />
        <MetricCard
          className="animate-rise stagger-3"
          label="Joint spending"
          value={formatMoney(summary.joint.amount, household.currency)}
          icon={Users}
          color="#FF8A70"
          footer={
            summary.joint.amount > 0 ? (
              <span>
                {formatPercent(summary.joint.share)} of all spending · {summary.joint.count}{" "}
                {summary.joint.count === 1 ? "entry" : "entries"}
              </span>
            ) : (
              "No expenses from the joint account yet."
            )
          }
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-12 lg:gap-4">
        <Card className="animate-rise stagger-2 p-5 lg:col-span-12">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10.5px] font-medium uppercase tracking-[0.15em] text-muted">Spending pace</p>
              <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-white">The month, so far</h2>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-brand" /> This month
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-px w-3 border-t border-dashed border-white/35" /> Last month
              </span>
            </div>
          </div>

          <div className="mt-4">
            <SpendTrendChart
              current={summary.daily}
              previous={previousSummary.daily}
              currency={household.currency}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-white/[0.055] pt-3 text-[11px] text-muted">
            {previousAtSamePoint > 0 ? (
              <>
                <span>
                  By this point last month you&apos;d spent{" "}
                  <span className="num text-white/85">{formatMoney(previousAtSamePoint, household.currency)}</span>.
                </span>
                <DeltaChip value={paceChange} positiveIsGood={false} />
              </>
            ) : (
              <span>No last-month data to compare yet.</span>
            )}
            <span className="ml-auto text-muted/60">
              {summary.expenseCount} {summary.expenseCount === 1 ? "expense" : "expenses"} logged
            </span>
          </div>
        </Card>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-12 lg:gap-4">
        <div className="animate-rise stagger-4 lg:col-span-5">
          <CategoryCard
            categories={summary.byCategory}
            total={summary.expenses}
            currency={household.currency}
          />
        </div>
        <div className="animate-rise stagger-5 lg:col-span-7">
          <BudgetPulseCard summary={budgetSummary} currency={household.currency} />
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-12 lg:gap-4">
        <div className="animate-rise stagger-5 lg:col-span-7">
          <RecentActivityCard
            transactions={recent}
            members={members}
            currency={household.currency}
            month={month}
          />
        </div>
        <div className="animate-rise stagger-6 lg:col-span-5">
          <WhoPaidCard
            byPayer={summary.byPayer}
            currentUserId={user.id}
            currency={household.currency}
          />
        </div>
      </div>
    </div>
  );
}
