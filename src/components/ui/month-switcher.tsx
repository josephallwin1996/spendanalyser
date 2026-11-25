"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { currentMonthKey, monthLabel, monthOptions, shiftMonth } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function MonthSwitcher({ month, className }: { month: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const current = currentMonthKey();

  const options = useMemo(() => {
    const keys = new Set(monthOptions(24).map((option) => option.key));
    keys.add(month);
    return Array.from(keys)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => ({ key, label: monthLabel(key) }));
  }, [month]);

  function navigate(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", next);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  const nextMonth = shiftMonth(month, 1);
  const atLatest = nextMonth > current;

  return (
    <div
      className={cn(
        "inline-flex h-10 items-center rounded-2xl border border-white/[0.08] bg-white/[0.025] p-1 transition-opacity",
        pending && "opacity-60",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Previous month"
        onClick={() => navigate(shiftMonth(month, -1))}
        className="grid size-8 place-items-center rounded-xl text-muted transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        <ChevronLeft size={16} />
      </button>
      <label className="relative flex h-8 items-center gap-1.5 rounded-xl px-1.5 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.04]">
        <CalendarDays size={14} className="text-muted" />
        <span className="sr-only">Choose month</span>
        <select
          value={month}
          onChange={(event) => navigate(event.target.value)}
          className="cursor-pointer appearance-none bg-transparent pr-4 text-[13px] font-medium text-white outline-none"
        >
          {options.map((option) => (
            <option key={option.key} value={option.key} className="bg-[#14161b]">
              {option.label}
              {option.key === current ? " · current" : ""}
            </option>
          ))}
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-muted" />
      </label>
      <button
        type="button"
        aria-label="Next month"
        disabled={atLatest}
        onClick={() => navigate(nextMonth)}
        className="grid size-8 place-items-center rounded-xl text-muted transition-colors hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-25"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
