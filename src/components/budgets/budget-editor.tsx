"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CircleAlert, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";
import { saveBudgets } from "@/app/actions/budgets";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { buttonClass } from "@/components/ui/button";
import { Spinner } from "@/components/ui/field";
import { idleState } from "@/lib/action-state";
import { BUDGET_CATEGORIES } from "@/lib/categories";
import { currentMonthKey, daysInMonth, remainingDays } from "@/lib/dates";
import { currencySymbol, formatMoney, formatPercent } from "@/lib/format";
import type { Budget } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BudgetEditor({
  budgets,
  spentByCategory,
  totalExpenses,
  currency,
  month,
}: {
  budgets: Budget[];
  spentByCategory: Record<string, number>;
  totalExpenses: number;
  currency: string;
  month: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveBudgets, idleState);
  const handled = useRef(false);

  const initial = useMemo(() => {
    const map: Record<string, string> = {};
    for (const category of BUDGET_CATEGORIES) {
      const budget = budgets.find((entry) => entry.category === category.id);
      map[category.id] = budget ? String(budget.amount) : "";
    }
    return map;
  }, [budgets]);

  const [values, setValues] = useState<Record<string, string>>(initial);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (state.status === "success" && !handled.current) {
      handled.current = true;
      toast.success(state.message ?? "Budgets saved.");
      router.refresh();
    }
    if (state.status === "error") {
      handled.current = false;
    }
  }, [state, router]);

  const dirty = touched && Object.keys(initial).some((key) => (values[key] ?? "") !== (initial[key] ?? ""));
  const symbol = currencySymbol(currency);

  const totals = useMemo(() => {
    let budgeted = 0;
    let spentInBudget = 0;
    for (const category of BUDGET_CATEGORIES) {
      const amount = Number(values[category.id] || 0);
      if (Number.isFinite(amount) && amount > 0) {
        budgeted += amount;
        spentInBudget += spentByCategory[category.id] ?? 0;
      }
    }
    return {
      budgeted,
      spentInBudget,
      remaining: budgeted - spentInBudget,
      ratio: budgeted > 0 ? spentInBudget / budgeted : 0,
      unbudgeted: Math.max(0, totalExpenses - spentInBudget),
    };
  }, [values, spentByCategory, totalExpenses]);

  const daysLeft = remainingDays(month);
  const isPast = month < currentMonthKey();
  const dailyAllowance = daysLeft > 0 ? Math.max(totals.remaining, 0) / daysLeft : 0;
  const setCount = Object.values(values).filter((value) => Number(value) > 0).length;

  return (
    <form action={formAction} className="pb-24 lg:pb-0">
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.055] px-5 py-4">
            <div>
              <p className="text-[10.5px] font-medium uppercase tracking-[0.15em] text-muted">Category limits</p>
              <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-white">
                {setCount > 0 ? `${setCount} budgets set` : "Set your monthly limits"}
              </h2>
            </div>
            {setCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  const cleared: Record<string, string> = {};
                  for (const category of BUDGET_CATEGORIES) cleared[category.id] = "";
                  setValues(cleared);
                  setTouched(true);
                }}
                className="text-[11px] text-muted transition-colors hover:text-white"
              >
                Clear all
              </button>
            ) : null}
          </div>

          <div className="divide-y divide-white/[0.04]">
            {BUDGET_CATEGORIES.map((category) => {
              const raw = values[category.id] ?? "";
              const budget = Number(raw || 0);
              const spent = spentByCategory[category.id] ?? 0;
              const ratio = budget > 0 ? spent / budget : 0;
              const over = budget > 0 && spent > budget;
              const error = state.fieldErrors?.[`budget_${category.id}`];

              return (
                <div key={category.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                    <CategoryIcon categoryId={category.id} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[12.5px] font-medium text-white">{category.label}</p>
                        {over ? (
                          <span className="rounded-full bg-coral/[0.1] px-1.5 py-0.5 text-[9px] font-medium text-coral">
                            over
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[10.5px] text-muted">
                        <span className="num">{formatMoney(spent, currency)}</span> spent
                        {budget > 0 ? (
                          <>
                            {" "}
                            · <span className="num">{formatPercent(ratio)}</span> used
                          </>
                        ) : (
                          " · no limit"
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          "flex h-9 w-[132px] items-center gap-1 rounded-xl border bg-white/[0.03] px-2.5 transition focus-within:border-brand/45 focus-within:ring-4 focus-within:ring-brand/[0.06]",
                          error ? "border-red-400/40" : "border-white/[0.08]",
                        )}
                      >
                        <span className="text-[11px] text-muted/70">{symbol}</span>
                        <input
                          name={`budget_${category.id}`}
                          value={raw}
                          onChange={(event) => {
                            const next = event.target.value;
                            if (next === "" || /^\d*\.?\d{0,2}$/.test(next)) {
                              setValues((current) => ({ ...current, [category.id]: next }));
                              setTouched(true);
                            }
                          }}
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          aria-label={`${category.label} monthly budget`}
                          className="num h-full w-full bg-transparent text-right text-[12px] font-medium text-white outline-none placeholder:text-muted/30"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center gap-3 pl-[52px]">
                    <ProgressBar
                      ratio={ratio}
                      color={category.color}
                      over={over}
                      className="h-1"
                    />
                    <span className="num w-20 shrink-0 text-right text-[9.5px] text-muted/60">
                      {budget > 0 ? `${formatMoney(Math.max(budget - spent, 0), currency)} left` : "—"}
                    </span>
                  </div>
                  {error ? <p className="mt-1.5 pl-[52px] text-[10.5px] text-red-300">{error}</p> : null}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4 lg:sticky lg:top-6">
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10.5px] font-medium uppercase tracking-[0.15em] text-muted">Your plan</p>
                <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-white">Monthly overview</h2>
              </div>
              <span className="grid size-8 place-items-center rounded-xl bg-brand/10 text-brand">
                <Target size={15} />
              </span>
            </div>

            <p className="num mt-5 text-[30px] font-semibold leading-none tracking-[-0.045em] text-white">
              {formatMoney(totals.budgeted, currency)}
            </p>
            <p className="mt-1 text-[10.5px] text-muted">total budget for {setCount} categories</p>

            <div className="mt-4">
              <ProgressBar ratio={totals.ratio} over={totals.remaining < 0} />
              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="text-muted">
                  <span className="num text-white/85">{formatMoney(totals.spentInBudget, currency)}</span> spent
                </span>
                <span className={totals.remaining < 0 ? "text-coral" : "text-brand"}>
                  {totals.remaining < 0
                    ? `${formatMoney(Math.abs(totals.remaining), currency)} over`
                    : `${formatMoney(totals.remaining, currency)} left`}
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/[0.055] pt-4">
              <div>
                <p className="text-[9.5px] uppercase tracking-[0.1em] text-muted/70">
                  {isPast ? "Month closed" : "Daily allowance"}
                </p>
                <p className="num mt-1 text-[14px] font-medium text-white">
                  {isPast ? "—" : formatMoney(dailyAllowance, currency)}
                </p>
                <p className="text-[9.5px] text-muted/60">
                  {isPast ? "A look back" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
                </p>
              </div>
              <div>
                <p className="text-[9.5px] uppercase tracking-[0.1em] text-muted/70">Unbudgeted</p>
                <p className="num mt-1 text-[14px] font-medium text-white">
                  {formatMoney(totals.unbudgeted, currency)}
                </p>
                <p className="text-[9.5px] text-muted/60">spent outside limits</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={pending || !dirty}
              className={buttonClass("primary", "md", "mt-5 w-full")}
            >
              {pending ? <Spinner /> : dirty ? <Check size={15} /> : <Check size={15} />}
              {pending ? "Saving…" : dirty ? "Save budgets" : "All changes saved"}
            </button>

            {state.status === "error" && state.message ? (
              <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-red-300">
                <CircleAlert size={13} className="mt-0.5 shrink-0" />
                {state.message}
              </p>
            ) : null}
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/[0.045] text-brand">
                <Sparkles size={14} />
              </span>
              <div>
                <p className="text-[12px] font-medium text-white">A gentle nudge</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  Budgets repeat every month. Leave a field at zero to skip that category.
                </p>
              </div>
            </div>
          </Card>

          <p className="px-1 text-[10.5px] leading-relaxed text-muted/60">
            {daysInMonth(month)} days in this month ·{" "}
            <Link href="/transactions" className="text-muted underline-offset-4 hover:text-white hover:underline">
              review transactions
            </Link>
          </p>
        </div>
      </div>

      {dirty ? (
        <div className="fixed inset-x-3 bottom-[calc(68px+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 rounded-2xl border border-white/[0.1] bg-[#14161b]/95 p-2.5 pl-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-xl lg:hidden">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted">Unsaved budget changes</p>
            <p className="num text-[13px] font-medium text-white">{formatMoney(totals.budgeted, currency)} total</p>
          </div>
          <button type="submit" disabled={pending} className={buttonClass("primary", "sm")}>
            {pending ? <Spinner /> : null}
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      ) : null}
    </form>
  );
}
