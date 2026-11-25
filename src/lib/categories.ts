import type { TxType } from "./types";

export type Category = {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
};

export const CATEGORIES = [
  {
    id: "groceries",
    label: "Groceries",
    shortLabel: "Groceries",
    icon: "ShoppingBasket",
    color: "#A3E635",
  },
  {
    id: "dining",
    label: "Dining out",
    shortLabel: "Dining",
    icon: "Utensils",
    color: "#FB923C",
  },
  {
    id: "home",
    label: "Rent & home",
    shortLabel: "Home",
    icon: "Home",
    color: "#60A5FA",
  },
  {
    id: "utilities",
    label: "Utilities",
    shortLabel: "Utilities",
    icon: "Zap",
    color: "#FACC15",
  },
  {
    id: "transport",
    label: "Transport",
    shortLabel: "Transport",
    icon: "Car",
    color: "#22D3EE",
  },
  {
    id: "shopping",
    label: "Shopping",
    shortLabel: "Shopping",
    icon: "ShoppingBag",
    color: "#F472B6",
  },
  {
    id: "health",
    label: "Health",
    shortLabel: "Health",
    icon: "HeartPulse",
    color: "#F87171",
  },
  {
    id: "fun",
    label: "Entertainment",
    shortLabel: "Fun",
    icon: "Clapperboard",
    color: "#C084FC",
  },
  {
    id: "travel",
    label: "Travel",
    shortLabel: "Travel",
    icon: "Plane",
    color: "#34D399",
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    shortLabel: "Subs",
    icon: "Repeat",
    color: "#818CF8",
  },
  {
    id: "family",
    label: "Family & kids",
    shortLabel: "Family",
    icon: "Baby",
    color: "#FDBA74",
  },
  {
    id: "gifts",
    label: "Gifts",
    shortLabel: "Gifts",
    icon: "Gift",
    color: "#E879F9",
  },
  {
    id: "other",
    label: "Other",
    shortLabel: "Other",
    icon: "Shapes",
    color: "#94A3B8",
  },
  {
    id: "income",
    label: "Income",
    shortLabel: "Income",
    icon: "Wallet",
    color: "#4ADE80",
  },
] as const satisfies readonly Category[];

export const EXPENSE_CATEGORIES = CATEGORIES.filter((c) => c.id !== "income");
export const INCOME_CATEGORY = "income";
export const CATEGORY_IDS: Set<string> = new Set(CATEGORIES.map((c) => c.id));
export const BUDGET_CATEGORIES = EXPENSE_CATEGORIES;

export function getCategory(id: string): Category {
  return CATEGORIES.find((category) => category.id === id) ?? CATEGORIES[CATEGORIES.length - 2];
}

const CATEGORY_SYNONYMS: Record<string, string> = {
  food: "dining",
  restaurant: "dining",
  restaurants: "dining",
  cafe: "dining",
  coffee: "dining",
  groceries: "groceries",
  grocery: "groceries",
  supermarket: "groceries",
  rent: "home",
  housing: "home",
  mortgage: "home",
  bills: "utilities",
  utility: "utilities",
  electricity: "utilities",
  internet: "utilities",
  fuel: "transport",
  travel: "travel",
  flights: "travel",
  hotel: "travel",
  medical: "health",
  pharmacy: "health",
  fitness: "health",
  gym: "health",
  entertainment: "fun",
  movies: "fun",
  subscriptions: "subscriptions",
  subscription: "subscriptions",
  kids: "family",
  baby: "family",
  shopping: "shopping",
  clothes: "shopping",
  gifts: "gifts",
  salary: "income",
  income: "income",
};

/** Resolve a raw category string (id, label, or synonym) into a canonical category id. */
export function resolveCategory(raw: string | undefined, type: TxType): string {
  if (type === "income") return INCOME_CATEGORY;
  if (!raw) return "other";
  const normalized = raw
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  if (!normalized) return "other";

  const direct = EXPENSE_CATEGORIES.find(
    (category) =>
      category.id === normalized ||
      category.label.toLowerCase() === normalized ||
      category.shortLabel.toLowerCase() === normalized,
  );
  if (direct) return direct.id;
  if (CATEGORY_SYNONYMS[normalized]) return CATEGORY_SYNONYMS[normalized];

  const partial = EXPENSE_CATEGORIES.find(
    (category) => normalized.includes(category.id) || category.label.toLowerCase().includes(normalized),
  );
  return partial?.id ?? "other";
}
