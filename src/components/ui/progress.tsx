import { cn } from "@/lib/utils";

export function ProgressBar({
  ratio,
  color = "#CDF56B",
  className,
  over = false,
}: {
  ratio: number;
  color?: string;
  className?: string;
  over?: boolean;
}) {
  const width = Math.max(0, Math.min(ratio, 1)) * 100;
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]", className)}>
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{
          width: `${width}%`,
          background: over ? "#F87171" : color,
          boxShadow: `0 0 12px ${over ? "#F8717166" : `${color}55`}`,
        }}
      />
    </div>
  );
}
