import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import type { PublicUser } from "@/lib/types";

export function MobileTopBar({ user }: { user: PublicUser }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.055] bg-ink/75 px-4 backdrop-blur-xl sm:px-6 lg:hidden">
      <Link href="/dashboard" aria-label="Tandem home">
        <Logo />
      </Link>
      <Link
        href="/settings"
        aria-label="Settings"
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
      >
        <Avatar name={user.name} color={user.color} size="md" />
      </Link>
    </header>
  );
}
