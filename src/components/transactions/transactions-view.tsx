"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  SlidersHorizontal,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { deleteTransaction } from "@/app/actions/transactions";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { CategoryIcon } from "@/components/ui/category-icon";
import { PayerAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/field";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { relativeDayLabel } from "@/lib/dates";
import { firstName, formatMoney } from "@/lib/format";
import type { PublicUser, Transaction, TxType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TRANSACTIONS_PER_PAGE = 15;

type Filters = {
  month: string;
  category?: string;
  paidBy?: string;
  type?: TxType;
  query?: string;
};

export function TransactionsView({
  transactions,
  members,
  currency,
  currentUserId,
  filters,
}: {
  transactions: Transaction[];
  members: PublicUser[];
  currency: string;
  currentUserId: string;
  filters: Filters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.query ?? "");
  const [pagination, setPagination] = useState({ month: filters.month, page: 1 });
  const currentPage = pagination.month === filters.month ? pagination.page : 1;
  const [dialog, setDialog] = useState<{ transaction?: Transaction } | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [deletePending, startDelete] = useTransition();

  const currentQuery = searchParams.get("q") ?? "";

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      params.delete("edit");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search.trim() === currentQuery) return;
      updateParams((params) => {
        if (search.trim()) params.set("q", search.trim());
        else params.delete("q");
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search, currentQuery, updateParams]);

  function setFilter(key: string, value: string) {
    setCurrentPage(1);
    updateParams((params) => {
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
    });
  }

  const totals = useMemo(() => {
    let expenses = 0;
    let income = 0;
    for (const transaction of transactions) {
      if (transaction.type === "income") income += transaction.amount;
      else expenses += transaction.amount;
    }
    return { expenses, income };
  }, [transactions]);

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    const pageCount = Math.ceil(transactions.length / TRANSACTIONS_PER_PAGE);
    const page = Math.min(currentPage, Math.max(pageCount, 1));
    const pageTransactions = transactions.slice(
      (page - 1) * TRANSACTIONS_PER_PAGE,
      page * TRANSACTIONS_PER_PAGE,
    );

    for (const transaction of pageTransactions) {
      const list = map.get(transaction.date) ?? [];
      list.push(transaction);
      map.set(transaction.date, list);
    }
    return Array.from(map.entries()).map(([date, items]) => ({
      date,
      items,
      spent: items
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0),
      received: items
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0),
    }));
  }, [transactions, currentPage]);

  const pageCount = Math.ceil(transactions.length / TRANSACTIONS_PER_PAGE);
  const page = Math.min(currentPage, Math.max(pageCount, 1));
  const firstVisible = transactions.length === 0 ? 0 : (page - 1) * TRANSACTIONS_PER_PAGE + 1;
  const lastVisible = Math.min(page * TRANSACTIONS_PER_PAGE, transactions.length);
  const hasFilters = Boolean(filters.category || filters.paidBy || filters.type || filters.query);

  function setCurrentPage(nextPage: number) {
    setPagination({ month: filters.month, page: nextPage });
  }

  function clearFilters() {
    setSearch("");
    setCurrentPage(1);
    updateParams((params) => {
      for (const key of ["category", "paidBy", "type", "q"]) params.delete(key);
    });
  }

  function updateSearch(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  function confirmDelete() {
    if (!deleting) return;
    startDelete(async () => {
      const result = await deleteTransaction(deleting.id);
      if (result.status === "success") {
        toast.success(result.message ?? "Transaction deleted.");
        setDeleting(null);
        router.refresh();
      } else {
        toast.error(result.message ?? "Could not delete that transaction.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex h-9 items-center rounded-xl border border-white/[0.07] bg-white/[0.025] p-0.5">
              {(
                [
                  { value: "", label: "All" },
                  { value: "expense", label: "Expenses" },
                  { value: "income", label: "Income" },
                ] as const
              ).map((tab) => {
                const active = (filters.type ?? "") === tab.value;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => setFilter("type", tab.value)}
                    className={cn(
                      "h-8 rounded-lg px-3 text-[12px] font-medium transition-colors",
                      active ? "bg-white/[0.09] text-white" : "text-muted hover:text-white",
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="relative min-w-[190px] flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted/70" />
              <input
                value={search}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Search descriptions…"
                aria-label="Search transactions"
                className="h-9 w-full rounded-xl border border-white/[0.07] bg-white/[0.025] pl-9 pr-8 text-[12.5px] text-white outline-none transition placeholder:text-muted/50 focus:border-brand/40 focus:ring-4 focus:ring-brand/[0.06]"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => updateSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-white/[0.06] hover:text-white"
                >
                  <X size={12} />
                </button>
              ) : null}
            </div>

            <Select
              aria-label="Filter by category"
              value={filters.category ?? "all"}
              onChange={(event) => setFilter("category", event.target.value)}
              className="h-9 w-[142px] rounded-xl text-[12px]"
            >
              <option value="all" className="bg-[#14161b]">All categories</option>
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.id} className="bg-[#14161b]">
                  {category.label}
                </option>
              ))}
            </Select>

            <Select
              aria-label="Filter by who paid"
              value={filters.paidBy ?? "all"}
              onChange={(event) => setFilter("paidBy", event.target.value)}
              className="h-9 w-[132px] rounded-xl text-[12px]"
            >
              <option value="all" className="bg-[#14161b]">Everyone</option>
              {members.map((member) => (
                <option key={member.id} value={member.id} className="bg-[#14161b]">
                  {firstName(member.name)}
                </option>
              ))}
              <option value="joint" className="bg-[#14161b]">Joint</option>
            </Select>

            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-[11.5px] text-muted transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                <SlidersHorizontal size={13} /> Clear
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.055] pt-3">
            <p className="text-[11.5px] text-muted">
              {transactions.length} transaction{transactions.length === 1 ? "" : "s"}
              {hasFilters ? " matching filters" : ""}
            </p>
            <div className="flex items-center gap-4 text-[11.5px]">
              <span className="text-muted">
                Spent <span className="num ml-1 font-medium text-white">{formatMoney(totals.expenses, currency)}</span>
              </span>
              {totals.income > 0 ? (
                <span className="text-muted">
                  In <span className="num ml-1 font-medium text-mint">{formatMoney(totals.income, currency)}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <div className={cn("space-y-4 transition-opacity", pending && "opacity-60")}>
        {groups.length === 0 ? (
          <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.025] text-muted">
              <ReceiptText size={24} />
            </span>
            <h3 className="mt-5 text-[15px] font-semibold text-white">
              {hasFilters ? "No transactions match those filters" : "Your ledger is waiting"}
            </h3>
            <p className="mt-1.5 max-w-xs text-[12.5px] leading-relaxed text-muted">
              {hasFilters
                ? "Try a different category, person or search term."
                : "Add your first expense, or import a CSV to bring in the last few months."}
            </p>
            <div className="mt-5 flex gap-2">
              {hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => setDialog({})}>
                  <Plus size={15} /> Add transaction
                </Button>
              )}
            </div>
          </Card>
        ) : (
          groups.map((group) => (
            <Card key={group.date} className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[0.055] bg-white/[0.012] px-4 py-2.5 sm:px-5">
                <div className="flex items-center gap-2.5">
                  <p className="text-[11.5px] font-medium text-white">{relativeDayLabel(group.date)}</p>
                  <span className="text-[10.5px] text-muted">
                    {group.items.length} {group.items.length === 1 ? "entry" : "entries"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10.5px] text-muted">
                  {group.spent > 0 ? (
                    <span>
                      <span className="num text-white/80">{formatMoney(group.spent, currency)}</span> spent
                    </span>
                  ) : null}
                  {group.received > 0 ? (
                    <span>
                      <span className="num text-mint">{formatMoney(group.received, currency)}</span> in
                    </span>
                  ) : null}
                </div>
              </div>

              <ul className="divide-y divide-white/[0.035]">
                {group.items.map((transaction) => {
                  const category = getCategory(transaction.category);
                  const payer =
                    transaction.paidBy === "joint"
                      ? "Joint account"
                      : members.find((member) => member.id === transaction.paidBy)?.name ?? "Former member";

                  return (
                    <li key={transaction.id} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.018] sm:px-5">
                      <CategoryIcon categoryId={transaction.category} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-white">{transaction.description}</p>
                        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[10.5px] text-muted">
                          <span style={{ color: category.color }}>{category.label}</span>
                          <span className="text-white/20">·</span>
                          <PayerAvatar paidBy={transaction.paidBy} members={members} size="xs" />
                          <span className="truncate">
                            {transaction.paidBy === currentUserId ? "You" : firstName(payer)}
                          </span>
                          {transaction.notes ? (
                            <>
                              <span className="text-white/20">·</span>
                              <StickyNote size={10} className="shrink-0" />
                              <span className="truncate">{transaction.notes}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <p
                        className={cn(
                          "num shrink-0 text-[13px] font-semibold tracking-tight",
                          transaction.type === "income" ? "text-mint" : "text-white",
                        )}
                      >
                        {transaction.type === "income" ? "+" : ""}
                        {formatMoney(transaction.amount, currency)}
                      </p>
                      <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                        <button
                          type="button"
                          onClick={() => setDialog({ transaction })}
                          aria-label={`Edit ${transaction.description}`}
                          className="grid size-7 place-items-center rounded-lg text-muted transition-colors hover:bg-white/[0.06] hover:text-white"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(transaction)}
                          aria-label={`Delete ${transaction.description}`}
                          className="grid size-7 place-items-center rounded-lg text-muted transition-colors hover:bg-red-500/10 hover:text-red-300"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))
        )}
      </div>

      {pageCount > 1 ? (
        <nav
          aria-label="Transaction pages"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
        >
          <p aria-live="polite" className="text-[11.5px] text-muted">
            Showing {firstVisible}–{lastVisible} of {transactions.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(page - 1)}
              disabled={page === 1}
              aria-label="Previous transaction page"
            >
              <ChevronLeft size={14} /> Previous
            </Button>
            <span className="min-w-[72px] text-center text-[11.5px] text-muted">
              {page} / {pageCount}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(page + 1)}
              disabled={page === pageCount}
              aria-label="Next transaction page"
            >
              Next <ChevronRight size={14} />
            </Button>
          </div>
        </nav>
      ) : null}

      <TransactionDialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        members={members}
        currency={currency}
        transaction={dialog?.transaction}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete this transaction?"
        description={
          deleting
            ? `“${deleting.description}” for ${formatMoney(deleting.amount, currency)} will be removed for both of you. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        pending={deletePending}
      />

      <button
        type="button"
        onClick={() => setDialog({})}
        aria-label="Add transaction"
        className="fixed bottom-24 right-5 z-30 grid size-12 place-items-center rounded-full bg-brand text-[#101408] shadow-[0_12px_40px_-8px_rgba(205,245,107,0.5)] transition-transform active:scale-95 lg:hidden"
      >
        <Plus size={20} />
      </button>
    </div>
  );
}
