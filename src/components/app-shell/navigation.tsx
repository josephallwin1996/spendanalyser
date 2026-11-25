"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BarChart3,
  Home,
  LogOut,
  Settings,
  Target,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import type { PublicHousehold, PublicUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: Target },
  { href: "/insights", label: "Insights", icon: BarChart3 },
];

export function Sidebar({
  user,
  household,
  members,
}: {
  user: PublicUser;
  household: PublicHousehold;
  members: PublicUser[];
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[268px] flex-col border-r border-white/[0.055] bg-[#0a0b0e]/70 backdrop-blur-2xl lg:flex">
      <div className="px-6 pb-5 pt-6">
        <Link href="/dashboard" className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
          <Logo />
        </Link>
      </div>

      <Link
        href="/settings"
        className="mx-4 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5 transition-colors hover:border-white/[0.1] hover:bg-white/[0.045]"
      >
        <AvatarStack members={members} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-medium text-white">{household.name}</span>
          <span className="block text-[11px] text-muted">Shared household</span>
        </span>
        <span className="size-1.5 rounded-full bg-brand/80" />
      </Link>

      <nav className="mt-8 flex-1 px-4">
        <p className="mb-2 px-3 text-[10.5px] font-medium uppercase tracking-[0.18em] text-muted/70">Your money</p>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex h-10 items-center gap-3 rounded-xl px-3 text-[13.5px] font-medium transition-all",
                    active
                      ? "bg-white/[0.065] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
                      : "text-muted hover:bg-white/[0.035] hover:text-white",
                  )}
                >
                  <item.icon
                    size={17}
                    strokeWidth={active ? 2.1 : 1.8}
                    className={active ? "text-brand" : "text-muted/80 transition-colors group-hover:text-white"}
                  />
                  {item.label}
                  {active ? <span className="ml-auto size-1.5 rounded-full bg-brand" /> : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mb-2 mt-7 px-3 text-[10.5px] font-medium uppercase tracking-[0.18em] text-muted/70">Household</p>
        <ul className="space-y-1">
          <li>
            <Link
              href="/settings"
              className={cn(
                "group flex h-10 items-center gap-3 rounded-xl px-3 text-[13.5px] font-medium transition-all",
                pathname === "/settings"
                  ? "bg-white/[0.065] text-white"
                  : "text-muted hover:bg-white/[0.035] hover:text-white",
              )}
            >
              <Settings
                size={17}
                strokeWidth={pathname === "/settings" ? 2.1 : 1.8}
                className={pathname === "/settings" ? "text-brand" : "text-muted/80 transition-colors group-hover:text-white"}
              />
              Settings
              {pathname === "/settings" ? <span className="ml-auto size-1.5 rounded-full bg-brand" /> : null}
            </Link>
          </li>
        </ul>
      </nav>

      <div className="p-4">
        {members.length < 2 ? (
          <Link
            href="/settings"
            className="mb-3 block rounded-2xl border border-brand/15 bg-brand/[0.055] p-3.5 transition-colors hover:border-brand/25 hover:bg-brand/[0.08]"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-brand/80">Invite your person</p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Share code <span className="font-mono font-semibold tracking-widest text-white">{household.inviteCode}</span>{" "}
              to make it a two-person ledger.
            </p>
          </Link>
        ) : null}

        <div className="flex items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-2.5">
          <Avatar name={user.name} color={user.color} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-medium text-white">{user.name}</p>
            <p className="truncate text-[11px] text-muted">{user.email}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              title="Sign out"
              aria-label="Sign out"
              className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const items = [...NAV_ITEMS, { href: "/settings", label: "Settings", icon: Settings }];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-[#0a0b0e]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[9.5px] font-medium transition-colors",
                active ? "text-white" : "text-muted",
              )}
            >
              <span
                className={cn(
                  "grid h-7 w-11 place-items-center rounded-full transition-colors",
                  active && "bg-brand/10 text-brand",
                )}
              >
                <item.icon size={18} strokeWidth={active ? 2.1 : 1.8} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
