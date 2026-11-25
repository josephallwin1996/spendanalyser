"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { login, signup } from "@/app/actions/auth";
import { idleState } from "@/lib/action-state";
import { Field, FormAlert, Input, Spinner } from "@/components/ui/field";

function PasswordToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "Hide password" : "Show password"}
      className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted transition-colors hover:bg-white/[0.05] hover:text-white"
    >
      {visible ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );
}

function IconWrap({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/70">{children}</span>
  );
}

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, idleState);
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand">Welcome back</p>
      <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.04em] text-white">
        Pick up where you two left off.
      </h1>
      <p className="mt-2.5 text-sm leading-relaxed text-muted">
        Sign in to see this month&apos;s spending, budgets and what&apos;s left to settle.
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        {state.status === "error" && state.message ? <FormAlert>{state.message}</FormAlert> : null}

        <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
          <div className="relative">
            <IconWrap>
              <Mail size={15} />
            </IconWrap>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              hasError={Boolean(state.fieldErrors?.email)}
              className="pl-10"
            />
          </div>
        </Field>

        <Field label="Password" htmlFor="password" error={state.fieldErrors?.password}>
          <div className="relative">
            <IconWrap>
              <Lock size={15} />
            </IconWrap>
            <Input
              id="password"
              name="password"
              type={visible ? "text" : "password"}
              placeholder="Your password"
              autoComplete="current-password"
              required
              hasError={Boolean(state.fieldErrors?.password)}
              className="pl-10 pr-11"
            />
            <PasswordToggle visible={visible} onToggle={() => setVisible((value) => !value)} />
          </div>
        </Field>

        <button
          type="submit"
          disabled={pending}
          className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-[#101408] transition-all hover:bg-[#d8fb86] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:opacity-60"
        >
          {pending ? <Spinner /> : null}
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-7 text-center text-[13px] text-muted">
        New to Tandem?{" "}
        <Link href="/signup" className="font-medium text-white underline-offset-4 transition-colors hover:text-brand hover:underline">
          Start your shared ledger
        </Link>
      </p>
    </div>
  );
}

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, idleState);
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand">Start together</p>
      <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.04em] text-white">
        A clearer money picture, for both of you.
      </h1>
      <p className="mt-2.5 text-sm leading-relaxed text-muted">
        Create your account first. You&apos;ll set up a household and invite your partner in the next step.
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        {state.status === "error" && state.message ? <FormAlert>{state.message}</FormAlert> : null}

        <Field label="Your name" htmlFor="name" error={state.fieldErrors?.name}>
          <div className="relative">
            <IconWrap>
              <User size={15} />
            </IconWrap>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Maya Sharma"
              autoComplete="name"
              required
              hasError={Boolean(state.fieldErrors?.name)}
              className="pl-10"
            />
          </div>
        </Field>

        <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
          <div className="relative">
            <IconWrap>
              <Mail size={15} />
            </IconWrap>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              hasError={Boolean(state.fieldErrors?.email)}
              className="pl-10"
            />
          </div>
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={state.fieldErrors?.password}
          hint="At least 8 characters."
        >
          <div className="relative">
            <IconWrap>
              <Lock size={15} />
            </IconWrap>
            <Input
              id="password"
              name="password"
              type={visible ? "text" : "password"}
              placeholder="Create a password"
              autoComplete="new-password"
              minLength={8}
              required
              hasError={Boolean(state.fieldErrors?.password)}
              className="pl-10 pr-11"
            />
            <PasswordToggle visible={visible} onToggle={() => setVisible((value) => !value)} />
          </div>
        </Field>

        <button
          type="submit"
          disabled={pending}
          className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-[#101408] transition-all hover:bg-[#d8fb86] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:opacity-60"
        >
          {pending ? <Spinner /> : null}
          {pending ? "Creating your account…" : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-[11.5px] leading-relaxed text-muted/70">
        By continuing, you agree to keep this shared space kind and honest.
      </p>

      <p className="mt-5 text-center text-[13px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-white underline-offset-4 transition-colors hover:text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
