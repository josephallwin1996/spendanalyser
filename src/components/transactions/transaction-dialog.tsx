"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, Check, Plus, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { saveTransaction } from "@/app/actions/transactions";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Avatar, JointAvatar } from "@/components/ui/avatar";
import { Dialog } from "@/components/ui/dialog";
import { Field, FormAlert, Input, Spinner } from "@/components/ui/field";
import { buttonClass } from "@/components/ui/button";
import { idleState } from "@/lib/action-state";
import { EXPENSE_CATEGORIES, getCategory } from "@/lib/categories";
import { currencySymbol, firstName } from "@/lib/format";
import { todayISO } from "@/lib/dates";
import type { PublicUser, Transaction, TxType } from "@/lib/types";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  members: PublicUser[];
  currency: string;
  transaction?: Transaction | null;
};

export function TransactionDialog(props: DialogProps) {
  if (!props.open) return null;
  return <TransactionDialogContent key={props.transaction?.id ?? "new"} {...props} />;
}

function TransactionDialogContent({ onClose, members, currency, transaction }: DialogProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveTransaction, idleState);
  const handled = useRef(false);
  const [type, setType] = useState<TxType>(transaction?.type ?? "expense");
  const [category, setCategory] = useState(
    transaction && transaction.category !== "income" ? transaction.category : "groceries",
  );
  const [paidBy, setPaidBy] = useState(
    transaction?.paidBy === "joint" && transaction.type === "income"
      ? members[0]?.id ?? "joint"
      : transaction?.paidBy ?? members[0]?.id ?? "joint",
  );

  const isEdit = Boolean(transaction);
  const symbol = currencySymbol(currency);

  useEffect(() => {
    if (state.status === "success" && !handled.current) {
      handled.current = true;
      toast.success(state.message ?? "Transaction saved.");
      router.refresh();
      onClose();
    }
  }, [state, router, onClose]);

  function changeType(next: TxType) {
    setType(next);
    if (next === "income") {
      setCategory("income");
      setPaidBy((current) => (current === "joint" ? members[0]?.id ?? current : current));
    } else if (category === "income") {
      setCategory("groceries");
    }
  }

  const selectedCategory = getCategory(type === "income" ? "income" : category);

  return (
    <Dialog
      open
      onClose={() => {
        if (!pending) onClose();
      }}
      title={isEdit ? "Edit transaction" : "Add a transaction"}
      description={
        isEdit
          ? "Update the details and both of you will see the change."
          : "Log it once. It shows up in both of your totals."
      }
      eyebrow={isEdit ? undefined : "New entry"}
    >
      <form action={formAction} className="space-y-5">
        {transaction ? <input type="hidden" name="id" value={transaction.id} /> : null}
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="category" value={type === "income" ? "income" : category} />
        <input type="hidden" name="paidBy" value={paidBy} />

        {state.status === "error" && state.message ? <FormAlert>{state.message}</FormAlert> : null}

        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-1">
          <button
            type="button"
            onClick={() => changeType("expense")}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl text-[12.5px] font-medium transition-all",
              type === "expense" ? "bg-coral/[0.13] text-coral" : "text-muted hover:text-white",
            )}
          >
            <ArrowUpRight size={14} /> Expense
          </button>
          <button
            type="button"
            onClick={() => changeType("income")}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl text-[12.5px] font-medium transition-all",
              type === "income" ? "bg-mint/[0.12] text-mint" : "text-muted hover:text-white",
            )}
          >
            <ArrowDownLeft size={14} /> Income
          </button>
        </div>

        <div>
          <label htmlFor="amount" className="mb-1.5 block text-[12px] font-medium text-[#B7BCC8]">
            Amount
          </label>
          <div
            className={cn(
              "flex items-center gap-1 rounded-2xl border bg-white/[0.03] px-4 transition focus-within:border-brand/45 focus-within:ring-4 focus-within:ring-brand/[0.07]",
              state.fieldErrors?.amount ? "border-red-400/40" : "border-white/[0.09]",
            )}
          >
            <span className="text-xl font-medium text-muted">{symbol}</span>
            <input
              id="amount"
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              placeholder="0"
              defaultValue={transaction?.amount ?? ""}
              required
              className="num h-16 w-full bg-transparent text-[34px] font-semibold tracking-tight text-white outline-none placeholder:text-muted/25"
            />
          </div>
          {state.fieldErrors?.amount ? (
            <p className="mt-1.5 text-[11.5px] text-red-300">{state.fieldErrors.amount}</p>
          ) : null}
        </div>

        <Field label="Description" htmlFor="description" error={state.fieldErrors?.description}>
          <Input
            id="description"
            name="description"
            placeholder={type === "income" ? "e.g. November salary" : "e.g. BigBasket weekly shop"}
            defaultValue={transaction?.description ?? ""}
            maxLength={80}
            required
            hasError={Boolean(state.fieldErrors?.description)}
          />
        </Field>

        {type === "expense" ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#B7BCC8]">Category</span>
              <span className="text-[11px]" style={{ color: selectedCategory.color }}>
                {selectedCategory.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {EXPENSE_CATEGORIES.map((option) => {
                const active = category === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setCategory(option.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex h-10 items-center gap-2 rounded-xl border px-2.5 text-left text-[11.5px] font-medium transition-all",
                      active
                        ? "border-brand/35 bg-brand/[0.075] text-white"
                        : "border-white/[0.06] bg-white/[0.02] text-muted hover:border-white/[0.12] hover:text-white",
                    )}
                  >
                    <CategoryIcon categoryId={option.id} size="sm" bare />
                    <span className="truncate">{option.shortLabel}</span>
                    {active ? <Check size={12} className="ml-auto shrink-0 text-brand" /> : null}
                  </button>
                );
              })}
            </div>
            {state.fieldErrors?.category ? (
              <p className="mt-1.5 text-[11.5px] text-red-300">{state.fieldErrors.category}</p>
            ) : null}
          </div>
        ) : null}

        <div>
          <span className="mb-2 block text-[12px] font-medium text-[#B7BCC8]">
            {type === "income" ? "Received by" : "Paid by"}
          </span>
          <div className="flex flex-wrap gap-2">
            {members.map((member) => {
              const active = paidBy === member.id;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setPaidBy(member.id)}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-full border pl-1 pr-3 text-[12px] font-medium transition-all",
                    active
                      ? "border-white/[0.18] bg-white/[0.07] text-white"
                      : "border-white/[0.07] bg-white/[0.02] text-muted hover:text-white",
                  )}
                >
                  <Avatar name={member.name} color={member.color} size="xs" />
                  {firstName(member.name)}
                </button>
              );
            })}
            {type === "expense" ? (
              <button
                type="button"
                onClick={() => setPaidBy("joint")}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-full border pl-1 pr-3 text-[12px] font-medium transition-all",
                  paidBy === "joint"
                    ? "border-white/[0.18] bg-white/[0.07] text-white"
                    : "border-white/[0.07] bg-white/[0.02] text-muted hover:text-white",
                )}
              >
                <JointAvatar size="xs" />
                Joint
              </button>
            ) : null}
          </div>
          {state.fieldErrors?.paidBy ? (
            <p className="mt-1.5 text-[11.5px] text-red-300">{state.fieldErrors.paidBy}</p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date" htmlFor="date" error={state.fieldErrors?.date}>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={transaction?.date ?? todayISO()}
              required
              hasError={Boolean(state.fieldErrors?.date)}
              className="[color-scheme:dark]"
            />
          </Field>
          <Field label="Note (optional)" htmlFor="notes" error={state.fieldErrors?.notes}>
            <div className="relative">
              <StickyNote size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60" />
              <Input
                id="notes"
                name="notes"
                placeholder="Anything to remember?"
                defaultValue={transaction?.notes ?? ""}
                maxLength={300}
                className="pl-9"
              />
            </div>
          </Field>
        </div>

        <div className="sticky bottom-[-20px] z-10 -mx-6 flex items-center justify-between gap-3 border-t border-white/[0.06] bg-[#101217]/95 px-6 pt-4 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-xl sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:backdrop-blur-none">
          <p className="max-w-[150px] text-[10.5px] leading-relaxed text-muted/70">
            {type === "income" ? "Money in" : "Money out"} · visible to both of you
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} disabled={pending} className={buttonClass("ghost", "md")}>
              Cancel
            </button>
            <button type="submit" disabled={pending} className={buttonClass("primary", "md", "min-w-[132px]")}>
              {pending ? <Spinner /> : null}
              {pending ? "Saving…" : isEdit ? "Save changes" : type === "income" ? "Add income" : "Add expense"}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}

export function AddTransactionButton({
  members,
  currency,
  label = "Add transaction",
  variant = "primary",
  size = "md",
  className,
}: {
  members: PublicUser[];
  currency: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass(variant, size, className)}>
        <Plus size={16} />
        {label}
      </button>
      <TransactionDialog
        open={open}
        onClose={() => setOpen(false)}
        members={members}
        currency={currency}
      />
    </>
  );
}
