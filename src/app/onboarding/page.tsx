import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, LockKeyhole, Sparkles } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import { requireViewer } from "@/lib/auth";
import { firstName } from "@/lib/format";

export const metadata: Metadata = {
  title: "Set up your household",
};

export default async function OnboardingPage() {
  const viewer = await requireViewer();
  if (viewer.household) redirect("/dashboard");

  return (
    <div className="grain relative min-h-dvh overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 size-[520px] rounded-full bg-brand/[0.055] blur-[130px]" />
        <div className="absolute -right-32 bottom-0 size-[460px] rounded-full bg-coral/[0.04] blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(#ffffff_1px,transparent_1px),linear-gradient(90deg,#ffffff_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-7 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Tandem home">
            <Logo />
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg px-2 py-1 text-[12px] text-muted transition-colors hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[1fr_0.85fr]">
            <div className="flex justify-center lg:justify-start">
              <OnboardingFlow defaultName={`${firstName(viewer.user.name)} & partner`} />
            </div>

            <div className="relative hidden lg:block">
              <div className="relative mx-auto max-w-[350px] rounded-[30px] border border-white/[0.08] bg-[#0F1116]/80 p-7 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.95)] backdrop-blur">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/[0.06] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-brand">
                  <Sparkles size={10} /> Your shared space
                </span>

                <div className="mt-8 flex items-center justify-center">
                  <div className="relative flex items-center">
                    <Avatar name={viewer.user.name} color={viewer.user.color} size="xl" />
                    <span className="mx-2 h-px w-12 border-t border-dashed border-white/20" />
                    <span className="grid size-12 place-items-center rounded-full border border-dashed border-white/20 text-muted">
                      <span className="text-lg">+</span>
                    </span>
                  </div>
                </div>

                <p className="mt-6 text-center text-[15px] font-semibold tracking-tight text-white">
                  {viewer.user.name}
                  <span className="font-normal text-muted"> & their person</span>
                </p>
                <p className="mt-1 text-center text-[11.5px] text-muted">
                  Two perspectives, one clear picture.
                </p>

                <div className="mt-7 space-y-3 border-t border-white/[0.06] pt-5">
                  {[
                    ["Shared ledger", "Every expense, visible to both."],
                    ["Fair splits", "Who paid, who owes, settled simply."],
                    ["Budgets in sync", "Stay aligned without the check-ins."],
                  ].map(([title, copy]) => (
                    <div key={title} className="flex gap-3">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                        <ArrowUpRight size={11} />
                      </span>
                      <div>
                        <p className="text-[12px] font-medium text-white">{title}</p>
                        <p className="text-[11px] leading-relaxed text-muted">{copy}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-2 rounded-xl bg-white/[0.025] px-3 py-2.5 text-[10.5px] leading-relaxed text-muted/80">
                  <LockKeyhole size={12} className="shrink-0" />
                  Your household is private. Only the two of you can see it.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
