import {
  Baby,
  Car,
  Clapperboard,
  Gift,
  HeartPulse,
  Home,
  Plane,
  Repeat,
  Shapes,
  ShoppingBag,
  ShoppingBasket,
  Utensils,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { getCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  ShoppingBasket,
  Utensils,
  Home,
  Zap,
  Car,
  ShoppingBag,
  HeartPulse,
  Clapperboard,
  Plane,
  Repeat,
  Baby,
  Gift,
  Shapes,
  Wallet,
};

const SIZES = {
  sm: { box: "size-8 rounded-xl", icon: 15 },
  md: { box: "size-10 rounded-[14px]", icon: 18 },
  lg: { box: "size-12 rounded-2xl", icon: 21 },
} as const;

export function CategoryIcon({
  categoryId,
  size = "md",
  className,
  bare = false,
}: {
  categoryId: string;
  size?: keyof typeof SIZES;
  className?: string;
  bare?: boolean;
}) {
  const category = getCategory(categoryId);
  const Icon = ICONS[category.icon] ?? Shapes;
  const sizing = SIZES[size];

  if (bare) {
    return <Icon size={sizing.icon} className={className} style={{ color: category.color }} strokeWidth={1.9} />;
  }

  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center", sizing.box, className)}
      style={{
        backgroundColor: `${category.color}18`,
        color: category.color,
        boxShadow: `inset 0 0 0 1px ${category.color}22`,
      }}
    >
      <Icon size={sizing.icon} strokeWidth={1.9} />
    </span>
  );
}
