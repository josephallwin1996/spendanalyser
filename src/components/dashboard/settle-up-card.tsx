"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, HandCoins, Scale, Users } from "lucide-react";
import { toast } from "sonner";
import { recordSettlement } from "@/app/actions/settlements";
import { Avatar, JointAvatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, FormAlert, Input, Spinner } from "@/components/ui/field";
import { buttonClass } from "@/components/ui/button";
import { idleState } from "@/lib/action-state";
import type { SettlementSummary } from "@/lib/analytics";
import { formatShortDate, monthLabel, todayISO } from "@/lib/dates";
import { currencySymbol, firstName, formatMoney } from "@/lib/format";
import type { PublicUser } from "@/lib/types";

export function SettleUpCard({
  summary,
  members,
  currency,
  month,
  currentUserId,
  inviteCode,
}: {
  summary: SettlementSummary;
  members: PublicUser[];
  currency: string;
  month: string;
  currentUserId: string;
  inviteCode: string;
}) {
  const [open, setOpen] = useState(false);

  if (!summary.hasPartner) {
    return (
      <Card className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.15em] text-muted">Settle up</p>
            <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-white">Better together</h2>
          </div>
          <span className="grid size-8 place-items-center rounded-xl bg-brand/10 text-brand">
            <Users size={15} />
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <div className="flex items-center">
            <Avatar name={members[0]?.name ?? "You"} color={members[0]?.color ?? "#FF8A70"} size="lg" />
            <span className="mx-2 h-px w-8 border-t border-dashed border-white/20" />
            <span className="grid size-10 place-items-center rounded-full border border-dashed border-white/20 text-muted">
              +
            </span>
          </div>
          <p className="mt-4 max-w-[220px] text-[12px] leading-relaxed text-muted">
            Invite your partner with code{" "}
            <span className="font-mono font-semibold tracking-widest text-white">{inviteCode}</span> to see fair-share
            balances here.
          </p>
          <Link href="/settings" className={buttonClass("secondary", "sm", "mt-4")}>
            Invite your person <ArrowRight size={13} />
          </Link>
        </div>
      </Card>
    );
  }

  const currentBalance = summary.balances.find((entry) => entry.member.id === currentUserId);
  const latestSettlement = summary.settlements[0];
  const settled = summary.amount === 0 || !summary.owedBy || !summary.owedTo;

  let headline = "";
  if (!settled && summary.owedBy && summary.owedTo) {
    if (summary.owedBy.id === currentUserId) headline = `You owe ${firstName(summary.owedTo.name)}`;
    else if (summary.owedTo.id === currentUserId) headline = `${firstName(summary.owedBy.name)} owes you`;
    else headline = `${firstName(summary.owedBy.name)} owes ${firstName(summary.owedTo.name)}`;
  }

  return (
    <>
      <Card className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.15em] text-muted">Settle up</p>
            <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-white">Between the two of you</h2>
          </div>
          <span className="grid size-8 place-items-center rounded-xl bg-brand/10 text-brand">
            <Scale size={15} />
          </span>
        </div>

        {settled ? (
          <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
            <span className="grid size-14 place-items-center rounded-full border border-mint/20 bg-mint/[0.07] text-mint">
              <Check size={24} />
            </span>
            <p className="mt-4 text-[15px] font-semibold tracking-tight text-white">
              You&apos;re all square
            </p>
            <p className="mt-1.5 max-w-[230px] text-[11.5px] leading-relaxed text-muted">
              {latestSettlement
                ? `${formatMoney(latestSettlement.amount, currency)} transferred on ${formatShortDate(latestSettlement.date)}. Nothing left to settle for ${monthLabel(month, "short")}.`
                : `No individual expenses to balance for ${monthLabel(month, "short")}.`}
            </p>
            {latestSettlement?.note ? (
              <p className="mt-2 text-[10.5px] italic text-muted/60">“{latestSettlement.note}”</p>
            ) : null}
          </div>
        ) : (
          <>
            <div className="mt-5 rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
              <div className="flex items-center gap-3">
                {summary.owedBy ? (
                  <Avatar name={summary.owedBy.name} color={summary.owedBy.color} size="lg" />
                ) : null}
                <div className="flex flex-1 items-center">
                  <span className="h-px flex-1 border-t border-dashed border-white/15" />
                  <span className="px-2 text-[9.5px] uppercase tracking-[0.12em] text-muted/70">owes</span>
                  <span className="h-px flex-1 border-t border-dashed border-white/15" />
                  <ArrowRight size={13} className="ml-1 text-muted/60" />
                </div>
                {summary.owedTo ? (
                  <Avatar name={summary.owedTo.name} color={summary.owedTo.color} size="lg" />
                ) : null}
              </div>
              <p className="mt-4 text-[12px] font-medium text-white">{headline}</p>
              <p className="num mt-1 text-[30px] font-semibold leading-none tracking-[-0.045em] text-brand">
                {formatMoney(summary.amount, currency)}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.055] pt-3">
                <div>
                  <p className="text-[9.5px] uppercase tracking-[0.1em] text-muted/70">You paid</p>
                  <p className="num mt-0.5 text-[12px] font-medium text-white">
                    {formatMoney(currentBalance?.paid ?? 0, currency)}
                  </p>
                </div>
                <div>
                  <p className="text-[9.5px] uppercase tracking-[0.1em] text-muted/70">Your fair share</p>
                  <p className="num mt-0.5 text-[12px] font-medium text-white">
                    {formatMoney(currentBalance?.fairShare ?? 0, currency)}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className={buttonClass("primary", "md", "mt-4 w-full")}
            >
              <HandCoins size={15} /> Record transfer
            </button>
          </>
        )}

        <div className="mt-4 border-t border-white/[0.055] pt-3 text-[10px] leading-relaxed text-muted/70">
          {members.length === 2
            ? `${members[0].sharePercent}/${members[1].sharePercent} split · Joint account expenses excluded.`
            : "Invite your partner to unlock fair-share balances."}
          {latestSettlement && !settled ? (
            <span className="mt-1 block">
              Last transfer {formatMoney(latestSettlement.amount, currency)} on {formatShortDate(latestSettlement.date)}.
            </span>
          ) : null}
        </div>
      </Card>

      {summary.owedBy && summary.owedTo ? (
        <RecordTransferDialog
          open={open}
          onClose={() => setOpen(false)}
          from={summary.owedBy}
          to={summary.owedTo}
          amount={summary.amount}
          currency={currency}
        />
      ) : null}
    </>
  );
}

function RecordTransferDialog({
  open,
  onClose,
  from,
  to,
  amount,
  currency,
}: {
  open: boolean;
  onClose: () => void;
  from: PublicUser;
  to: PublicUser;
  amount: number;
  currency: string;
}) {
  if (!open) return null;
  return (
    <RecordTransferDialogContent
      key={`${from.id}-${to.id}`}
      onClose={onClose}
      from={from}
      to={to}
      amount={amount}
      currency={currency}
    />
  );
}

function RecordTransferDialogContent({
  onClose,
  from,
  to,
  amount,
  currency,
}: {
  onClose: () => void;
  from: PublicUser;
  to: PublicUser;
  amount: number;
  currency: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(recordSettlement, idleState);
  const handled = useRef(false);

  useEffect(() => {
    if (state.status === "success" && !handled.current) {
      handled.current = true;
      toast.success(state.message ?? "Transfer recorded.");
      router.refresh();
      onClose();
    }
  }, [state, router, onClose]);

  return (
    <Dialog
      open
      onClose={() => {
        if (!pending) onClose();
      }}
      title="Record a transfer"
      description="This adjusts this month's balance between the two of you. It isn't a new expense."
      eyebrow="Settle up"
    >
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="fromUserId" value={from.id} />
        <input type="hidden" name="toUserId" value={to.id} />

        {state.status === "error" && state.message ? <FormAlert>{state.message}</FormAlert> : null}

        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5">
          <Avatar name={from.name} color={from.color} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] text-muted">From</p>
            <p className="truncate text-[12.5px] font-medium text-white">{from.name}</p>
          </div>
          <ArrowRight size={15} className="text-muted/60" />
          <div className="min-w-0 flex-1 text-right">
            <p className="text-[11.5px] text-muted">To</p>
            <p className="truncate text-[12.5px] font-medium text-white">{to.name}</p>
          </div>
          <Avatar name={to.name} color={to.color} size="lg" />
        </div>

        <div>
          <label htmlFor="settlement-amount" className="mb-1.5 block text-[12px] font-medium text-[#B7BCC8]">
            Amount
          </label>
          <div className="flex items-center gap-1 rounded-2xl border border-white/[0.09] bg-white/[0.03] px-4 transition focus-within:border-brand/45 focus-within:ring-4 focus-within:ring-brand/[0.07]">
            <span className="text-xl font-medium text-muted">{currencySymbol(currency)}</span>
            <input
              id="settlement-amount"
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              defaultValue={amount}
              required
              className="num h-14 w-full bg-transparent text-[28px] font-semibold tracking-tight text-white outline-none"
            />
          </div>
          {state.fieldErrors?.amount ? (
            <p className="mt-1.5 text-[11.5px] text-red-300">{state.fieldErrors.amount}</p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date" htmlFor="settlement-date" error={state.fieldErrors?.date}>
            <Input
              id="settlement-date"
              name="date"
              type="date"
              defaultValue={todayISO()}
              required
              className="[color-scheme:dark]"
            />
          </Field>
          <Field label="Note (optional)" htmlFor="settlement-note" error={state.fieldErrors?.note}>
            <Input
              id="settlement-note"
              name="note"
              placeholder="e.g. UPI transfer"
              maxLength={120}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
          <div className="flex items-center gap-2 text-[10.5px] text-muted/70">
            <JointAvatar size="xs" /> Not counted as spending
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} disabled={pending} className={buttonClass("ghost", "md")}>
              Cancel
            </button>
            <button type="submit" disabled={pending} className={buttonClass("primary", "md", "min-w-[130px]")}>
              {pending ? <Spinner /> : null}
              {pending ? "Recording…" : "Record transfer"}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
