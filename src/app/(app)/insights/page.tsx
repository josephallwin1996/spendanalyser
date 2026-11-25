import type { Metadata } from "next";
import { ArrowDownLeft, ArrowUpRight, PiggyBank, ReceiptText } from "lucide-react";
import { PageHeading } from "@/components/app-shell/page-heading";
import { MetricCard } from "@/components/dashboard/metric-card";
import {
  MonthlyCashflowCard,
  RangeSwitcher,
  TopCategoriesCard,
  TopMerchantsCard,
  WeekdaySpendCard,
  type RangeOption,
} from "@/components/insights/insights-charts";
import {
  summarizeByMonth,
  summarizeRange,
  topMerchants,
  weekdaySpend,
} from "@/lib/analytics";
import { requireHousehold } from "@/lib/auth";
import { getTransactionsForRange } from "@/lib/data";
import { lastNMonths, monthLabel, monthRange } from "@/lib/dates";
import { formatMoney, formatPercent } from "@/lib/format";

export const metadata: Metadata = {
  title: "Insights",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseRange(raw: string | string[] | undefined): RangeOption {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "3m" || value === "6m" || value === "12m") return value;
  return "6m";
}

export default async function InsightsPage({ searchParams }: { searchParams: SearchParams }) {
  const { household } = await requireHousehold();
  const params = await searchParams;
  const range = parseRange(params.range);
  const monthCount = range === "3m" ? 3 : range === "12m" ? 12 : 6;

  const months = lastNMonths(monthCount);
  const start = monthRange(months[0]).start;
  const end = monthRange(months[months.length - 1]).end;

  const transactions = await getTransactionsForRange(household.id, start, end);
  const summary = summarizeRange(transactions, months);
  const monthlySeries = summarizeByMonth(transactions, months);
  const merchants = topMerchants(transactions, 6);
  const weekdays = weekdaySpend(transactions);

  return (
    <div>
      <PageHeading
        eyebrow="Trends"
        title="Insights"
        description={`A ${monthCount}-month view from ${monthLabel(months[0], "short")} to ${monthLabel(months[months.length - 1], "short")}.`}
        actions={<RangeSwitcher range={range} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          className="animate-rise"
          label={`Spent (${range.toUpperCase()})`}
          value={formatMoney(summary.expenses, household.currency)}
          icon={ArrowUpRight}
          color="#FF8A70"
          glow
          footer={
            <span>
              Avg {formatMoney(summary.averagePerMonth, household.currency)}/mo · {summary.expenseCount}{" "}
              {summary.expenseCount === 1 ? "expense" : "expenses"}
            </span>
          }
        />
        <MetricCard
          className="animate-rise stagger-1"
          label={`Income (${range.toUpperCase()})`}
          value={formatMoney(summary.income, household.currency)}
          icon={ArrowDownLeft}
          color="#63E6C1"
          footer={
            <span>
              Net{" "}
              <span className={summary.net >= 0 ? "text-mint" : "text-coral"}>
                {formatMoney(summary.net, household.currency, { signed: true })}
              </span>{" "}
              over {summary.activeMonths} active {summary.activeMonths === 1 ? "month" : "months"}
            </span>
          }
        />
        <MetricCard
          className="animate-rise stagger-2"
          label="Savings rate"
          value={summary.savingsRate !== null ? formatPercent(summary.savingsRate) : "—"}
          icon={PiggyBank}
          color="#CDF56B"
          footer={
            <span>
              {summary.savingsRate !== null
                ? "Share of income kept after expenses."
                : "Log income to calculate your savings rate."}
            </span>
          }
        />
        <MetricCard
          className="animate-rise stagger-3"
          label="Largest expense"
          value={
            summary.largestExpense
              ? formatMoney(summary.largestExpense.amount, household.currency)
              : "—"
          }
          icon={ReceiptText}
          color="#FF8A70"
          footer={
            <span>
              {summary.largestExpense ? summary.largestExpense.description : "No expenses in this range."}
            </span>
          }
        />
      </div>

      <div className="mt-4">
        <MonthlyCashflowCard series={monthlySeries} currency={household.currency} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <WeekdaySpendCard weekdays={weekdays} currency={household.currency} />
        <TopMerchantsCard merchants={merchants} currency={household.currency} />
        <TopCategoriesCard categories={summary.byCategory} currency={household.currency} />
      </div>
    </div>
  );
}

