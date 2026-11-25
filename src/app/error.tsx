"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 grid size-14 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <RefreshCw className="text-muted" size={22} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Something slipped out of sync</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We hit an unexpected error while loading this page. Try again — your data is safe.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="h-10 rounded-xl bg-brand px-4 text-sm font-semibold text-[#101408] transition-colors hover:bg-[#d8fb86]"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="h-10 rounded-xl border border-white/[0.1] px-4 leading-10 text-sm text-white transition-colors hover:bg-white/[0.05]"
          >
            Go to overview
          </Link>
        </div>
      </div>
    </div>
  );
}
