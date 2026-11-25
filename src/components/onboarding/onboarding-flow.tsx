"use client";

import { useActionState, useState } from "react";
import { ArrowRight, KeyRound, Sparkles, Users } from "lucide-react";
import { createHousehold, joinHousehold } from "@/app/actions/household";
import { idleState } from "@/lib/action-state";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/lib/format";
import { Field, FormAlert, Input, Select, Spinner } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Mode = "create" | "join";

export function OnboardingFlow({ defaultName }: { defaultName: string }) {
  const [mode, setMode] = useState<Mode>("create");
  const [createState, createAction, createPending] = useActionState(createHousehold, idleState);
  const [joinState, joinAction, joinPending] = useActionState(joinHousehold, idleState);

  return (
    <div className="w-full max-w-[480px]">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand">One last step</p>
      <h1 className="mt-3 text-[34px] font-semibold leading-[1.06] tracking-[-0.05em] text-white sm:text-[40px]">
        Make it a<br />
        <span className="font-serif font-normal italic text-brand">two-person</span> ledger.
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
        Start a household and invite your partner, or join one they&apos;ve already created.
      </p>

      <div className="mt-7 rounded-[26px] border border-white/[0.08] bg-[#101217]/90 p-2 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-white/[0.025] p-1">
          {(
            [
              { id: "create", label: "Create a household", icon: Sparkles },
              { id: "join", label: "Join with a code", icon: KeyRound },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={cn(
                "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl text-[12px] font-medium transition-all",
                mode === tab.id
                  ? "bg-white/[0.075] text-white shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset]"
                  : "text-muted hover:text-white",
              )}
            >
              <tab.icon size={13} className={mode === tab.id ? "text-brand" : undefined} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {mode === "create" ? (
            <form action={createAction} className="space-y-4">
              {createState.status === "error" && createState.message ? (
                <FormAlert>{createState.message}</FormAlert>
              ) : null}

              <Field label="Household name" htmlFor="household-name" error={createState.fieldErrors?.name}>
                <Input
                  id="household-name"
                  name="name"
                  placeholder={defaultName}
                  defaultValue={defaultName}
                  maxLength={50}
                  required
                  hasError={Boolean(createState.fieldErrors?.name)}
                />
              </Field>

              <Field
                label="Currency"
                htmlFor="currency"
                hint="Used across every total, budget and transfer."
                error={createState.fieldErrors?.currency}
              >
                <Select id="currency" name="currency" defaultValue={DEFAULT_CURRENCY}>
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code} className="bg-[#14161b]">
                      {currency.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <button
                type="submit"
                disabled={createPending}
                className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-[#101408] transition-colors hover:bg-[#d8fb86] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 disabled:opacity-60"
              >
                {createPending ? <Spinner /> : null}
                {createPending ? "Creating…" : "Create household"}
                {!createPending ? <ArrowRight size={15} /> : null}
              </button>
            </form>
          ) : (
            <form action={joinAction} className="space-y-4">
              {joinState.status === "error" && joinState.message ? (
                <FormAlert>{joinState.message}</FormAlert>
              ) : null}

              <Field
                label="Invite code"
                htmlFor="code"
                error={joinState.fieldErrors?.code}
                hint="Six characters. Your partner can find it under Settings."
              >
                <Input
                  id="code"
                  name="code"
                  placeholder="A7K2QP"
                  maxLength={6}
                  required
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  hasError={Boolean(joinState.fieldErrors?.code)}
                  className="h-14 text-center font-mono text-xl font-semibold uppercase tracking-[0.5em] placeholder:tracking-[0.4em] placeholder:text-muted/30"
                  onChange={(event) => {
                    event.target.value = event.target.value.toUpperCase();
                  }}
                />
              </Field>

              <button
                type="submit"
                disabled={joinPending}
                className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-[#101408] transition-colors hover:bg-[#d8fb86] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 disabled:opacity-60"
              >
                {joinPending ? <Spinner /> : null}
                {joinPending ? "Joining…" : "Join household"}
                {!joinPending ? <ArrowRight size={15} /> : null}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 px-1 text-[11.5px] text-muted/70">
        <Users size={13} />
        Tandem is built for exactly two people. No extra seats, no extra noise.
      </div>
    </div>
  );
}
