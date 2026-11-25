import { formatMoney } from "@/lib/format";
import type { CategoryTotal } from "@/lib/analytics";

export function DonutChart({
  categories,
  total,
  currency,
}: {
  categories: CategoryTotal[];
  total: number;
  currency: string;
}) {
  const radius = 66;
  const stroke = 15;
  const circumference = 2 * Math.PI * radius;
  const gap = 3;
  const segments = categories.map((category, index) => ({
    ...category,
    offset:
      categories.slice(0, index).reduce((sum, item) => sum + item.share, 0) * circumference,
  }));

  return (
    <div className="relative grid size-[176px] shrink-0 place-items-center">
      <svg viewBox="0 0 176 176" className="size-full -rotate-90">
        <circle
          cx="88"
          cy="88"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.055)"
          strokeWidth={stroke}
        />
        {segments.map((category) => {
          const length = Math.max(0, category.share * circumference - gap);
          const dash = `${length} ${circumference - length}`;
          return (
            <circle
              key={category.id}
              cx="88"
              cy="88"
              r={radius}
              fill="none"
              stroke={category.color}
              strokeWidth={stroke}
              strokeDasharray={dash}
              strokeDashoffset={-category.offset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-muted">Total</p>
        <p className="num mt-1 max-w-[120px] text-[17px] font-semibold leading-tight tracking-tight text-white">
          {formatMoney(total, currency, { compact: total >= 1_000_000 })}
        </p>
        <p className="mt-0.5 text-[9.5px] text-muted/70">spent</p>
      </div>
    </div>
  );
}
