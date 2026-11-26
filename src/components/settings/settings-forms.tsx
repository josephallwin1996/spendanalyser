"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, LogOut, RefreshCw, Sparkles, User, Users } from "lucide-react";
import { toast } from "sonner";
import {
  leaveHousehold,
  regenerateInvite,
  updateHousehold,
  updateProfile,
} from "@/app/actions/household";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, FormAlert, Input, Select, Spinner } from "@/components/ui/field";
import { idleState, type ActionState } from "@/lib/action-state";
import { CURRENCIES } from "@/lib/format";
import type { PublicHousehold, PublicUser } from "@/lib/types";

function useActionToast(state: ActionState, fallback: string) {
  const router = useRouter();
  const lastHandled = useRef<ActionState | null>(null);

  useEffect(() => {
    if (state.status === "success" && lastHandled.current !== state) {
      lastHandled.current = state;
      toast.success(state.message ?? fallback);
      router.refresh();
    }
  }, [state, fallback, router]);
}

export function ProfileSettingsCard({ user }: { user: PublicUser }) {
  const [state, formAction, pending] = useActionState(updateProfile, idleState);
  useActionToast(state, "Profile updated.");

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.15em] text-muted">Your profile</p>
          <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-white">Personal details</h2>
        </div>
        <Avatar name={user.name} color={user.color} size="md" />
      </div>

      <form action={formAction} className="mt-5 space-y-4">
        {state.status === "error" && state.message ? <FormAlert>{state.message}</FormAlert> : null}

        <Field label="Display name" htmlFor="profile-name" error={state.fieldErrors?.name}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/70">
              <User size={15} />
            </span>
            <Input
              id="profile-name"
              name="name"
              defaultValue={user.name}
              required
              hasError={Boolean(state.fieldErrors?.name)}
              className="pl-10"
            />
          </div>
        </Field>

        <Field label="Email" htmlFor="profile-email" hint="Used to sign in to Tandem.">
          <Input id="profile-email" value={user.email} disabled className="text-muted" />
        </Field>

        <div className="flex justify-end pt-1">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Spinner /> : null}
            {pending ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function HouseholdSettingsCard({ household }: { household: PublicHousehold }) {
  const [state, formAction, pending] = useActionState(updateHousehold, idleState);
  useActionToast(state, "Household details saved.");

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.15em] text-muted">Household</p>
          <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-white">Name & currency</h2>
        </div>
        <span className="grid size-9 place-items-center rounded-xl bg-brand/10 text-brand">
          <Users size={16} />
        </span>
      </div>

      <form action={formAction} className="mt-5 space-y-4">
        {state.status === "error" && state.message ? <FormAlert>{state.message}</FormAlert> : null}

        <Field label="Household name" htmlFor="household-name" error={state.fieldErrors?.name}>
          <Input
            id="household-name"
            name="name"
            defaultValue={household.name}
            required
            hasError={Boolean(state.fieldErrors?.name)}
          />
        </Field>

        <Field
          label="Currency"
          htmlFor="household-currency"
          error={state.fieldErrors?.currency}
          hint="Applies to all household totals and budgets."
        >
          <Select id="household-currency" name="currency" defaultValue={household.currency}>
            {CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code} className="bg-[#101217] text-white">
                {currency.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex justify-end pt-1">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Spinner /> : null}
            {pending ? "Saving…" : "Save household"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function InviteSettingsCard({
  household,
  members,
}: {
  household: PublicHousehold;
  members: PublicUser[];
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(household.inviteCode);
      setCopied(true);
      toast.success("Invite code copied.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy code. Copy it manually.");
    }
  }

  function handleRegenerate() {
    startTransition(async () => {
      const result = await regenerateInvite();
      if (result.status === "success") {
        toast.success(result.message ?? "New invite code generated.");
        router.refresh();
      } else if (result.message) {
        toast.error(result.message);
      }
    });
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.15em] text-muted">Partners</p>
          <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-white">
            {members.length >= 2 ? "Both of you are connected" : "Invite your partner"}
          </h2>
        </div>
        <span className="grid size-9 place-items-center rounded-xl bg-mint/10 text-mint">
          <Sparkles size={16} />
        </span>
      </div>

      <div className="mt-5 space-y-2.5">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={member.name} color={member.color} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-white">{member.name}</p>
                <p className="truncate text-[11px] text-muted">{member.email}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Invite code</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-2xl font-semibold tracking-[0.26em] text-brand">
            {household.inviteCode}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={copyCode}>
              {copied ? <Check size={14} className="text-mint" /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRegenerate} disabled={pending}>
              <RefreshCw size={14} className={pending ? "animate-spin" : undefined} />
              New code
            </Button>
          </div>
        </div>
        <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
          {members.length >= 2
            ? "Your household is full (2 of 2). Regenerating invalidates any old code."
            : "Share this 6-character code so your partner can join during onboarding."}
        </p>
      </div>
    </Card>
  );
}

export function LeaveHouseholdCard({ householdName }: { householdName: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleLeave() {
    startTransition(async () => {
      await leaveHousehold();
    });
  }

  return (
    <>
      <Card className="border-red-400/15 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.15em] text-red-300/80">Danger zone</p>
            <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-white">Leave {householdName}</h2>
            <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-muted">
              You&apos;ll return to onboarding where you can join another household or start a new one. If you&apos;re
              the last member, the household is removed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className={buttonClass("danger", "sm")}
          >
            <LogOut size={14} /> Leave household
          </button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => !pending && setConfirmOpen(false)}
        onConfirm={handleLeave}
        title={`Leave ${householdName}?`}
        description="You will lose access to this household's shared ledger until invited back."
        confirmLabel="Leave household"
        pending={pending}
      />
    </>
  );
}

