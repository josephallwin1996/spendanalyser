import { requireHousehold } from "@/lib/auth";
import { MobileNav, Sidebar } from "@/components/app-shell/navigation";
import { MobileTopBar } from "@/components/app-shell/mobile-top-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, household, members } = await requireHousehold();

  return (
    <div className="grain relative min-h-dvh">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-48 -top-56 size-[520px] rounded-full bg-brand/[0.05] blur-[130px]" />
        <div className="absolute -right-40 top-16 size-[420px] rounded-full bg-coral/[0.035] blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 size-[420px] rounded-full bg-mint/[0.02] blur-[140px]" />
      </div>

      <Sidebar user={user} household={household} members={members} />

      <div className="relative z-10 lg:pl-[268px]">
        <MobileTopBar user={user} />
        <main className="mx-auto w-full max-w-[1380px] px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
