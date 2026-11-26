import Link from "next/link";
import { ArrowUpRight, CircleDashed, ReceiptText } from "lucide-react";
import { Avatar, JointAvatar, PayerAvatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import type { PayerTotal } from "@/lib/analytics";
import { firstName, formatMoney, formatPercent } from "@/lib/format";
import type { PublicUser, Transaction } from "@/lib/types";
import { getCategory } from "@/lib/categories";

export function WhoPaidCard({
  byPayer,
  currentUserId,
  currency,
}: {
  byPayer: PayerTotal[];
  currentUserId: string;
  currency: string;
}) {
  const total = byPayer.reduce((sum, payer) => sum + payer.amount, 0);

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.15em] text-muted">Contributions</p>
          <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-white">Who paid</h2>
        </div>
      </div>

      {total > 0 ? (
        <>
          <div className="mt-5 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-white/[0.05]">
            {byPayer
              .filter((payer) => payer.amount > 0)
              .map((payer) => (
                <div
                  key={payer.id}
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(payer.share * 100, 1.5)}%`, backgroundColor: payer.color }}
                  title={`${payer.name}: ${formatMoney(payer.amount, currency)}`}
                />
              ))}
          </div>

          <div className="mt-5 flex-1 space-y-3.5">
            {byPayer.map((payer) => {
              const name = payer.isJoint
                ? "Joint account"
                : `${firstName(payer.name)}${payer.id === currentUserId ? " (you)" : ""}`;
              return (
                <div key={payer.id} className="flex items-center gap-2.5">
                  {payer.isJoint ? (
                    <JointAvatar size="sm" />
                  ) : (
                    <Avatar name={payer.name} color={payer.color} size="sm" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[12px] text-white">{name}</span>
                  <span className="num text-[11.5px] font-medium text-white">
                    {formatMoney(payer.amount, currency)}
                  </span>
                  <span className="num w-9 text-right text-[10px] text-muted/70">
                    {formatPercent(payer.share)}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="mt-4 border-t border-white/[0.055] pt-3 text-[10.5px] leading-relaxed text-muted/70">
            Amounts show each person&apos;s share of total recorded expenses.
          </p>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <span className="grid size-12 place-items-center rounded-full border border-dashed border-white/[0.12] text-muted/70">
            <CircleDashed size={20} />
          </span>
          <p className="mt-3 text-[12.5px] text-muted">Nothing paid yet this month.</p>
        </div>
      )}
    </Card>
  );
}

export function RecentActivityCard({
  transactions,
  members,
  currency,
  month,
}: {
  transactions: Transaction[];
  members: PublicUser[];
  currency: string;
  month: string;
}) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5">
        <div>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.15em] text-muted">Latest entries</p>
          <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-white">Recent activity</h2>
        </div>
        <Link
          href={`/transactions?month=${month}`}
          className="inline-flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-white"
        >
          View all <ArrowUpRight size={12} />
        </Link>
      </div>

      {transactions.length > 0 ? (
        <ul className="flex-1 divide-y divide-white/[0.04] border-t border-white/[0.05]">
          {transactions.map((transaction) => {
            const category = getCategory(transaction.category);
            const payerName =
              transaction.paidBy === "joint"
                ? "Joint"
                : firstName(members.find((member) => member.id === transaction.paidBy)?.name ?? "—");
            return (
              <li key={transaction.id} className="flex items-center gap-3 px-5 py-3">
                <CategoryIcon categoryId={transaction.category} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-white">{transaction.description}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted">
                    <span style={{ color: category.color }}>{category.shortLabel}</span>
                    <span className="text-white/20">·</span>
                    <PayerAvatar paidBy={transaction.paidBy} members={members} size="xs" />
                    <span>{payerName}</span>
                  </p>
                </div>
                <span
                  className={`num text-[12px] font-medium ${
                    transaction.type === "income" ? "text-mint" : "text-white"
                  }`}
                >
                  {transaction.type === "income" ? "+" : ""}
                  {formatMoney(transaction.amount, currency)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center border-t border-white/[0.05] px-6 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-full border border-dashed border-white/[0.12] text-muted/70">
            <ReceiptText size={20} />
          </span>
          <p className="mt-3 text-[12.5px] text-muted">No entries for this month yet.</p>
          <Link href="/transactions" className="mt-2 text-[11.5px] font-medium text-brand hover:underline">
            Add the first one
          </Link>
        </div>
      )}
    </Card>
  );
}
