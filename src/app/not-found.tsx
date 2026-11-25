import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">This page isn&apos;t in the ledger</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The page you were looking for may have been moved, or never existed.
        </p>
        <Link
          href="/dashboard"
          className="mt-7 inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-[#101408] transition-colors hover:bg-[#d8fb86]"
        >
          Back to overview
        </Link>
      </div>
    </div>
  );
}
