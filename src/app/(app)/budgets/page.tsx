import type { Metadata } from "next";
import { PageHeading } from "@/components/app-shell/page-heading";
import { BudgetEditor } from "@/components/budgets/budget-editor";
import { MonthSwitcher } from "@/components/ui/month-switcher";
import { requireHousehold } from "@/lib/auth";
import { currentMonthKey, isValidMonth } from "@/lib/dates";
import { getBudgets, getTransactionsForMonth } from "@/lib/data";

export const metadata: Metadata = {
  title: "Budgets",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BudgetsPage({ searchParams }: { searchParams: SearchParams }) {
  const { household } = await requireHousehold();
  const params = await searchParams;
  const monthParam = first(params.month);
  const month = monthParam && isValidMonth(monthParam) ? monthParam : currentMonthKey();

  const [budgets, transactions] = await Promise.all([
    getBudgets(household.id),
    getTransactionsForMonth(household.id, month),
  ]);

  const spentByCategory: Record<string, number> = {};
  let totalExpenses = 0;
  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;
    spentByCategory[transaction.category] = (spentByCategory[transaction.category] ?? 0) + transaction.amount;
    totalExpenses += transaction.amount;
  }

  return (
    <div>
      <PageHeading
        eyebrow="Plan ahead"
        title="Budgets"
        description="Set a comfortable ceiling for each part of your life. We'll track the pace and tell you when things get tight."
        actions={<MonthSwitcher month={month} />}
      />

      <BudgetEditor
        key={budgets.map((budget) => `${budget.category}:${budget.amount}`).sort().join("|")}
        budgets={budgets}
        spentByCategory={spentByCategory}
        totalExpenses={totalExpenses}
        currency={household.currency}
        month={month}
      />
    </div>
  );
}
