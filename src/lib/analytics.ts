import { getCategory } from "./categories";
import { JOINT_COLOR } from "./constants";
import {
  currentMonthKey,
  daysInMonth,
  elapsedDays,
  monthDayKeys,
  monthKeyFromDate,
  todayISO,
  weekdayIndex,
} from "./dates";
import type { Budget, PublicUser, Transaction } from "./types";

export type CategoryTotal = {
  id: string;
  label: string;
  color: string;
  amount: number;
  count: number;
  share: number;
};

export type PayerTotal = {
  id: string;
  name: string;
  color: string;
  amount: number;
  count: number;
  share: number;
  isJoint: boolean;
};

export type DayPoint = {
  date: string;
  amount: number;
  cumulative: number;
};

export type MonthSummary = {
  month: string;
  expenses: number;
  income: number;
  net: number;
  expenseCount: number;
  incomeCount: number;
  byCategory: CategoryTotal[];
  byPayer: PayerTotal[];
  joint: { amount: number; count: number; share: number };
  daily: DayPoint[];
  averagePerDay: number;
  largestExpense: Transaction | null;
};

export type BudgetItem = {
  id: string;
  label: string;
  color: string;
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  ratio: number;
  count: number;
};

export type BudgetSummary = {
  items: BudgetItem[];
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  ratio: number;
  unbudgetedSpent: number;
  overCount: number;
};

export type RangeSummary = {
  expenses: number;
  income: number;
  net: number;
  expenseCount: number;
  byCategory: CategoryTotal[];
  averagePerMonth: number;
  savingsRate: number | null;
  largestExpense: Transaction | null;
  activeMonths: number;
};

export type MerchantTotal = {
  name: string;
  amount: number;
  count: number;
};

export type WeekdayTotal = {
  day: string;
  amount: number;
  count: number;
  share: number;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export function categoryTotals(expenses: Transaction[]): CategoryTotal[] {
  const total = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);
  const map = new Map<string, { amount: number; count: number }>();

  for (const transaction of expenses) {
    const current = map.get(transaction.category) ?? { amount: 0, count: 0 };
    current.amount += transaction.amount;
    current.count += 1;
    map.set(transaction.category, current);
  }

  return Array.from(map.entries())
    .map(([id, value]) => {
      const category = getCategory(id);
      return {
        id,
        label: category.label,
        color: category.color,
        amount: round(value.amount),
        count: value.count,
        share: total > 0 ? value.amount / total : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export function summarizeMonth(
  transactions: Transaction[],
  month: string,
  members: PublicUser[],
): MonthSummary {
  const monthTransactions = transactions.filter(
    (transaction) => monthKeyFromDate(transaction.date) === month,
  );
  const expensesList = monthTransactions.filter((transaction) => transaction.type === "expense");
  const incomeList = monthTransactions.filter((transaction) => transaction.type === "income");

  const expenses = round(expensesList.reduce((sum, transaction) => sum + transaction.amount, 0));
  const income = round(incomeList.reduce((sum, transaction) => sum + transaction.amount, 0));

  const byCategory = categoryTotals(expensesList);

  const byPayer: PayerTotal[] = members.map((member) => {
    const paid = expensesList.filter(
      (transaction) => transaction.paidBy === member.id && transaction.type === "expense",
    );
    const amount = round(paid.reduce((sum, transaction) => sum + transaction.amount, 0));
    return {
      id: member.id,
      name: member.name,
      color: member.color,
      amount,
      count: paid.length,
      share: expenses > 0 ? amount / expenses : 0,
      isJoint: false,
    };
  });

  const jointTransactions = expensesList.filter((transaction) => transaction.paidBy === "joint");
  const jointAmount = round(jointTransactions.reduce((sum, transaction) => sum + transaction.amount, 0));
  byPayer.push({
    id: "joint",
    name: "Joint account",
    color: JOINT_COLOR,
    amount: jointAmount,
    count: jointTransactions.length,
    share: expenses > 0 ? jointAmount / expenses : 0,
    isJoint: true,
  });

  const today = todayISO();
  const dayKeys = monthDayKeys(month);
  const current = month === currentMonthKey();
  const todayDay = current ? Number(today.slice(8, 10)) : dayKeys.length;
  const lastTransactionDay = expensesList.reduce((max, transaction) => {
    return Math.max(max, Number(transaction.date.slice(8, 10)));
  }, 0);
  const cutoff = Math.min(dayKeys.length, Math.max(current ? todayDay : 0, lastTransactionDay));

  let cumulative = 0;
  const daily: DayPoint[] = dayKeys.slice(0, cutoff).map((date) => {
    const dayExpenses = expensesList
      .filter((transaction) => transaction.date === date)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    cumulative += dayExpenses;
    return {
      date,
      amount: round(dayExpenses),
      cumulative: round(cumulative),
    };
  });

  const daysForAverage = current
    ? Math.max(1, Number(today.slice(8, 10)))
    : Math.max(1, daysInMonth(month));
  const averagePerDay = round(expenses / daysForAverage);

  const largestExpense =
    expensesList.slice().sort((a, b) => b.amount - a.amount)[0] ?? null;

  return {
    month,
    expenses,
    income,
    net: round(income - expenses),
    expenseCount: expensesList.length,
    incomeCount: incomeList.length,
    byCategory,
    byPayer,
    joint: {
      amount: jointAmount,
      count: jointTransactions.length,
      share: expenses > 0 ? jointAmount / expenses : 0,
    },
    daily,
    averagePerDay,
    largestExpense,
  };
}

export function summarizeRange(transactions: Transaction[], months: string[]): RangeSummary {
  const rangeTransactions = transactions.filter((transaction) =>
    months.includes(monthKeyFromDate(transaction.date)),
  );
  const expensesList = rangeTransactions.filter((transaction) => transaction.type === "expense");
  const incomeList = rangeTransactions.filter((transaction) => transaction.type === "income");
  const expenses = round(expensesList.reduce((sum, transaction) => sum + transaction.amount, 0));
  const income = round(incomeList.reduce((sum, transaction) => sum + transaction.amount, 0));
  const activeMonths = new Set(rangeTransactions.map((transaction) => monthKeyFromDate(transaction.date))).size;
  const largestExpense = expensesList.slice().sort((a, b) => b.amount - a.amount)[0] ?? null;

  return {
    expenses,
    income,
    net: round(income - expenses),
    expenseCount: expensesList.length,
    byCategory: categoryTotals(expensesList),
    averagePerMonth: round(expenses / Math.max(1, months.length)),
    savingsRate: income > 0 ? (income - expenses) / income : null,
    largestExpense,
    activeMonths,
  };
}

export function summarizeBudgets(transactions: Transaction[], budgets: Budget[]): BudgetSummary {
  const activeBudgets = budgets.filter((budget) => budget.amount > 0);
  const activeCategories = new Set(activeBudgets.map((budget) => budget.category));
  const expenses = transactions.filter((transaction) => transaction.type === "expense");

  let totalSpent = 0;
  let unbudgetedSpent = 0;
  const spendMap = new Map<string, { amount: number; count: number }>();

  for (const transaction of expenses) {
    const current = spendMap.get(transaction.category) ?? { amount: 0, count: 0 };
    current.amount += transaction.amount;
    current.count += 1;
    spendMap.set(transaction.category, current);
    if (activeCategories.has(transaction.category)) {
      totalSpent += transaction.amount;
    } else {
      unbudgetedSpent += transaction.amount;
    }
  }

  const items: BudgetItem[] = activeBudgets
    .map((budget) => {
      const category = getCategory(budget.category);
      const spend = spendMap.get(budget.category) ?? { amount: 0, count: 0 };
      const spent = round(spend.amount);
      const remaining = round(budget.amount - spent);
      return {
        id: budget.id,
        label: category.label,
        color: category.color,
        category: budget.category,
        budget: round(budget.amount),
        spent,
        remaining,
        ratio: budget.amount > 0 ? spent / budget.amount : 0,
        count: spend.count,
      };
    })
    .sort((a, b) => b.ratio - a.ratio);

  const totalBudget = round(activeBudgets.reduce((sum, budget) => sum + budget.amount, 0));
  const totalRemaining = round(totalBudget - totalSpent);

  return {
    items,
    totalBudget,
    totalSpent: round(totalSpent),
    totalRemaining,
    ratio: totalBudget > 0 ? totalSpent / totalBudget : 0,
    unbudgetedSpent: round(unbudgetedSpent),
    overCount: items.filter((item) => item.spent > item.budget).length,
  };
}

export function summarizeByMonth(transactions: Transaction[], months: string[]) {
  return months.map((month) => {
    const monthTransactions = transactions.filter(
      (transaction) => monthKeyFromDate(transaction.date) === month,
    );
    return {
      month,
      expenses: round(
        monthTransactions
          .filter((transaction) => transaction.type === "expense")
          .reduce((sum, transaction) => sum + transaction.amount, 0),
      ),
      income: round(
        monthTransactions
          .filter((transaction) => transaction.type === "income")
          .reduce((sum, transaction) => sum + transaction.amount, 0),
      ),
      count: monthTransactions.length,
    };
  });
}

export function topMerchants(transactions: Transaction[], limit = 5): MerchantTotal[] {
  const map = new Map<string, MerchantTotal>();

  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;
    const key = transaction.description.trim().toLowerCase();
    if (!key) continue;
    const current = map.get(key) ?? {
      name: transaction.description.trim(),
      amount: 0,
      count: 0,
    };
    current.amount += transaction.amount;
    current.count += 1;
    map.set(key, current);
  }

  return Array.from(map.values())
    .map((item) => ({ ...item, amount: round(item.amount) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

export function weekdaySpend(transactions: Transaction[]): WeekdayTotal[] {
  const totals = WEEKDAYS.map((day) => ({ day, amount: 0, count: 0, share: 0 }));
  let total = 0;

  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;
    const index = weekdayIndex(transaction.date);
    totals[index].amount += transaction.amount;
    totals[index].count += 1;
    total += transaction.amount;
  }

  return totals.map((entry) => ({
    ...entry,
    amount: round(entry.amount),
    share: total > 0 ? entry.amount / total : 0,
  }));
}

export function percentChange(currentValue: number, previousValue: number): number | null {
  if (previousValue <= 0) return null;
  return (currentValue - previousValue) / previousValue;
}

export function budgetStatus(ratio: number) {
  if (ratio > 1) return "over" as const;
  if (ratio >= 0.85) return "watch" as const;
  return "on-track" as const;
}

export function daysLeftInMonth(month: string) {
  if (month !== currentMonthKey()) return 0;
  return daysInMonth(month) - elapsedDays(month);
}
