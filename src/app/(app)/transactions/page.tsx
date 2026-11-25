import type { Metadata } from "next";
import { PageHeading } from "@/components/app-shell/page-heading";
import { AddTransactionButton } from "@/components/transactions/transaction-dialog";
import { ImportTransactionsButton } from "@/components/transactions/import-dialog";
import { TransactionsView } from "@/components/transactions/transactions-view";
import { MonthSwitcher } from "@/components/ui/month-switcher";
import { requireHousehold } from "@/lib/auth";
import { CATEGORY_IDS } from "@/lib/categories";
import { currentMonthKey, isValidMonth } from "@/lib/dates";
import { getTransactionsForMonth } from "@/lib/data";
import type { TxType } from "@/lib/types";

export const metadata: Metadata = {
  title: "Transactions",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  const viewer = await requireHousehold();
  const params = await searchParams;

  const monthParam = first(params.month);
  const month = monthParam && isValidMonth(monthParam) ? monthParam : currentMonthKey();

  const categoryParam = first(params.category);
  const category = categoryParam && CATEGORY_IDS.has(categoryParam) ? categoryParam : undefined;

  const paidByParam = first(params.paidBy);
  const paidBy =
    paidByParam === "joint" || viewer.members.some((member) => member.id === paidByParam)
      ? paidByParam
      : undefined;

  const typeParam = first(params.type);
  const type: TxType | undefined = typeParam === "expense" || typeParam === "income" ? typeParam : undefined;

  const query = first(params.q)?.trim().slice(0, 80) || undefined;

  const transactions = await getTransactionsForMonth(viewer.household.id, month, {
    category,
    paidBy,
    type,
    query,
  });

  return (
    <div>
      <PageHeading
        eyebrow="The ledger"
        title="Transactions"
        description="Every expense and deposit, side by side. Filter the noise to find what you're looking for."
        actions={
          <>
            <MonthSwitcher month={month} />
            <ImportTransactionsButton
              members={viewer.members}
              currency={viewer.household.currency}
              currentUserId={viewer.user.id}
            />
            <AddTransactionButton
              members={viewer.members}
              currency={viewer.household.currency}
              label="Add"
            />
          </>
        }
      />

      <TransactionsView
        transactions={transactions}
        members={viewer.members}
        currency={viewer.household.currency}
        currentUserId={viewer.user.id}
        filters={{ month, category, paidBy, type, query }}
      />
    </div>
  );
}
