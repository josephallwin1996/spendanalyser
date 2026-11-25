import { cn } from "@/lib/utils";

export function Logo({ className, markOnly = false }: { className?: string; markOnly?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative grid size-8 place-items-center" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none" className="size-8">
          <circle cx="12" cy="16" r="8.5" stroke="#FF8A70" strokeWidth="2.75" />
          <circle cx="20" cy="16" r="8.5" stroke="#63E6C1" strokeWidth="2.75" />
          <circle cx="16" cy="16" r="1.5" fill="#CDF56B" />
        </svg>
      </span>
      {!markOnly ? (
        <span className="text-[19px] font-semibold tracking-[-0.04em] text-white">
          tandem<span className="text-brand">.</span>
        </span>
      ) : null}
    </span>
  );
}
