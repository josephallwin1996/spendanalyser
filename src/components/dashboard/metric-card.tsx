import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DeltaChip({
  value,
  positiveIsGood = true,
}: {
  value: number | null;
  positiveIsGood?: boolean;
}) {
  if (value === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-muted">
        <Minus size={9} /> New
      </span>
    );
  }

  const rounded = Math.round(value * 100);
  const good = positiveIsGood ? rounded >= 0 : rounded <= 0;
  const Icon = rounded >= 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
        good ? "bg-mint/[0.09] text-mint" : "bg-coral/[0.1] text-coral",
      )}
    >
      <Icon size={9} />
      {Math.abs(rounded)}%
    </span>
  );
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  footer,
  glow = false,
  className,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  footer: React.ReactNode;
  glow?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn("relative overflow-hidden p-5", className)}>
      {glow ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full blur-3xl"
          style={{ backgroundColor: `${color}22` }}
        />
      ) : null}
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.15em] text-muted">{label}</p>
        <span
          className="grid size-8 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: `${color}14`, color }}
        >
          <Icon size={15} strokeWidth={1.9} />
        </span>
      </div>
      <p className="num relative mt-3 text-[27px] font-semibold leading-none tracking-[-0.045em] text-white">
        {value}
      </p>
      <div className="relative mt-3 text-[11px] leading-relaxed text-muted">{footer}</div>
    </Card>
  );
}
