import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Scale, ShieldCheck, Sparkles, Target } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { getViewer } from "@/lib/auth";

export default async function HomePage() {
  const viewer = await getViewer();
  if (viewer?.household) redirect("/dashboard");
  if (viewer) redirect("/onboarding");

  const highlights = [
    {
      icon: Sparkles,
      title: "Shared ledger, zero noise",
      copy: "Log personal or joint expenses in seconds and see how the month is pacing together.",
    },
    {
      icon: Scale,
      title: "Fair-share settlements",
      copy: "Split 50/50 or proportionally to income. Tandem calculates who owes whom automatically.",
    },
    {
      icon: Target,
      title: "Calm monthly budgets",
      copy: "Set category ceilings once and spot tight spots early before the month runs away.",
    },
  ];

  return (
    <div className="grain relative min-h-dvh overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 size-[520px] rounded-full bg-brand/[0.06] blur-[140px]" />
        <div className="absolute -right-32 top-24 size-[440px] rounded-full bg-coral/[0.045] blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 size-[420px] rounded-full bg-mint/[0.03] blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-7 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <Link href="/" aria-label="Tandem home">
            <Logo />
          </Link>
          <div className="flex items-center gap-2.5">
            <Link href="/login" className={buttonClass("ghost", "sm")}>
              Sign in
            </Link>
            <Link href="/signup" className={buttonClass("primary", "sm")}>
              Get started
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center py-14 lg:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/[0.06] px-3 py-1 text-[10.5px] font-medium uppercase tracking-[0.16em] text-brand">
              Built for two
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
              Money, in sync — without the spreadsheets.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Tandem is a calm, private spending tracker for couples. Track shared and individual expenses, keep
              budgets aligned, and settle up in a tap.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className={buttonClass("primary", "lg")}>
                Start your shared ledger <ArrowRight size={16} />
              </Link>
              <Link href="/login" className={buttonClass("secondary", "lg")}>
                Sign in to existing household
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="card-sheen rounded-3xl border border-white/[0.07] p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]"
              >
                <span className="grid size-9 place-items-center rounded-xl bg-brand/10 text-brand">
                  <item.icon size={16} />
                </span>
                <h2 className="mt-4 text-[15px] font-semibold tracking-tight text-white">{item.title}</h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{item.copy}</p>
              </div>
            ))}
          </div>
        </main>

        <footer className="flex items-center justify-between border-t border-white/[0.06] pt-6 text-[12px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-mint" /> Private to your two-person household
          </span>
          <span>Tandem</span>
        </footer>
      </div>
    </div>
  );
}
