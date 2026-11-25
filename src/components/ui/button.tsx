import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-[#101408] font-semibold shadow-[0_10px_30px_-12px_rgba(205,245,107,0.55)] hover:bg-[#d8fb86] active:bg-[#c4ec5f]",
  secondary:
    "bg-white/[0.055] text-white border border-white/[0.09] hover:bg-white/[0.09] hover:border-white/[0.14]",
  ghost: "text-muted hover:text-white hover:bg-white/[0.055]",
  danger:
    "bg-red-500/[0.09] text-red-300 border border-red-400/20 hover:bg-red-500/[0.15] hover:text-red-200",
  outline:
    "border border-white/[0.12] text-white hover:border-brand/50 hover:bg-brand/[0.06]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5 rounded-xl",
  md: "h-11 px-5 text-sm gap-2 rounded-2xl",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-2xl",
  icon: "size-9 rounded-xl",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({ variant = "primary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}
