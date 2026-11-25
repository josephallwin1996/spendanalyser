import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Avatar } from "@/components/ui/avatar";
import { formatMoney } from "@/lib/format";

const BARS = [44, 62, 38, 76, 54, 88, 48, 68, 58, 94, 72, 84];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-dvh lg:grid-cols-[1.02fr_0.98fr]">
      <div className="relative flex min-h-dvh flex-col px-5 py-7 sm:px-8 lg:px-12">
        <div>
          <Link href="/" className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
            <Logo />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[400px] animate-rise">{children}</div>
        </div>
        <p className="text-[11px] text-muted/60">© {new Date().getFullYear()} Tandem. Built for two.</p>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-white/[0.06] bg-[#0B0D11] lg:block">
        <div aria-hidden="true" className="absolute inset-0">
          <div className="absolute -right-24 -top-16 size-[420px] rounded-full bg-brand/[0.07] blur-[110px]" />
          <div className="absolute -bottom-32 left-0 size-[380px] rounded-full bg-coral/[0.06] blur-[110px]" />
          <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(#ffffff_1px,transparent_1px),linear-gradient(90deg,#ffffff_1px,transparent_1px)] [background-size:56px_56px]" />
        </div>

        <div className="relative flex h-full flex-col justify-center px-10 py-16 xl:px-16">
          <span className="mb-7 inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/80">
            <Sparkles size={12} className="text-brand" />
            A shared money app for two
          </span>

          <h2 className="max-w-md text-[42px] font-semibold leading-[1.02] tracking-[-0.055em] text-white xl:text-[50px]">
            The money talk,
            <br />
            minus the <span className="font-serif italic font-normal text-brand">awkwardness.</span>
          </h2>
          <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-muted">
            One ledger, two perspectives. See what you spend together, what you spend apart, and
            what you still owe each other — without a spreadsheet in sight.
          </p>

          <div className="relative mt-10 max-w-[390px]">
            <div className="rounded-[26px] border border-white/[0.09] bg-[#101217]/95 p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.17em] text-muted">November spending</p>
                  <p className="num mt-2 text-[28px] font-semibold tracking-tight text-white">
                    {formatMoney(124860, "INR")}
                  </p>
                </div>
                <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-semibold text-brand">−8.2%</span>
              </div>
              <div className="mt-5 flex h-16 items-end gap-1.5">
                {BARS.map((height, index) => (
                  <span
                    key={index}
                    className="flex-1 rounded-t-[3px]"
                    style={{
                      height: `${height}%`,
                      background: index === 9 ? "#CDF56B" : "rgba(255,255,255,0.09)",
                    }}
                  />
                ))}
              </div>
              <div className="mt-5 space-y-3 border-t border-white/[0.06] pt-4">
                <div className="flex items-center gap-2.5">
                  <Avatar name="Maya Sharma" color="#FF8A70" size="sm" />
                  <span className="text-[12px] text-white">Maya</span>
                  <span className="num ml-auto text-[12px] font-medium text-white">{formatMoney(68420, "INR")}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Avatar name="Arjun Mehta" color="#63E6C1" size="sm" />
                  <span className="text-[12px] text-white">Arjun</span>
                  <span className="num ml-auto text-[12px] font-medium text-white">{formatMoney(56440, "INR")}</span>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-8 -right-6 flex items-center gap-3 rounded-2xl border border-white/[0.09] bg-[#171A20] px-3.5 py-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]">
              <span className="grid size-8 place-items-center rounded-full bg-brand/10 text-brand">
                <Check size={15} />
              </span>
              <div>
                <p className="text-[11px] text-muted">Settlement suggestion</p>
                <p className="text-[12px] font-medium text-white">Arjun owes Maya {formatMoney(3240, "INR")}</p>
              </div>
            </div>
          </div>

          <ul className="mt-14 space-y-2.5">
            {["One shared ledger, updated by both of you", "Fair-share splits that update themselves", "Budgets you can actually stick to"].map(
              (item) => (
                <li key={item} className="flex items-center gap-2.5 text-[12.5px] text-muted">
                  <span className="grid size-4 place-items-center rounded-full bg-brand/10 text-brand">
                    <Check size={10} strokeWidth={2.5} />
                  </span>
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}
