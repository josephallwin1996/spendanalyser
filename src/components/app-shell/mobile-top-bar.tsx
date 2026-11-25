import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import type { PublicUser } from "@/lib/types";

export function MobileTopBar({ user }: { user: PublicUser }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.055] bg-ink/75 px-4 backdrop-blur-xl sm:px-6 lg:hidden">
      <Link href="/dashboard" aria-label="Tandem home">
        <Logo />
      </Link>
      <div className="flex items-center gap-2">
        <form action={signOut}>
          <button
            type="submit"
            aria-label="Sign out"
            title="Sign out"
            className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
          >
            <LogOut size={17} />
          </button>
        </form>
        <Link
          href="/settings"
          aria-label="Settings"
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
        >
          <Avatar name={user.name} color={user.color} size="md" />
        </Link>
      </div>
    </header>
  );
}
