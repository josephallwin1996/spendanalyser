import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeSettlement, summarizeBudgets, summarizeMonth } from "../analytics";
import { resolveCategory } from "../categories";
import { parseTransactionsCsv } from "../csv";
import { daysInMonth, isValidISODate, shiftMonth } from "../dates";
import type { Budget, PublicUser, Settlement, Transaction } from "../types";

const alice: PublicUser = {
  id: "u1",
  name: "Alice",
  email: "alice@example.com",
  color: "#FF8A70",
  sharePercent: 60,
  joinedAt: "2026-01-01T00:00:00.000Z",
};

const bob: PublicUser = {
  id: "u2",
  name: "Bob",
  email: "bob@example.com",
  color: "#63E6C1",
  sharePercent: 40,
  joinedAt: "2026-01-02T00:00:00.000Z",
};

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: "t1",
    description: "Groceries",
    amount: 100,
    type: "expense",
    category: "groceries",
    paidBy: "u1",
    createdBy: "u1",
    date: "2026-11-10",
    createdAt: "2026-11-10T00:00:00.000Z",
    ...overrides,
  };
}

describe("computeSettlement", () => {
  it("computes weighted fair-share excluding joint expenses and income", () => {
    const transactions: Transaction[] = [
      tx({ id: "1", amount: 1000, paidBy: "u1", type: "expense" }),
      tx({ id: "2", amount: 500, paidBy: "joint", type: "expense" }),
      tx({ id: "3", amount: 2000, paidBy: "u2", type: "income", category: "income" }),
    ];

    const result = computeSettlement(transactions, [], [alice, bob]);
    assert.equal(result.paidMembersTotal, 1000);
    assert.equal(result.amount, 400);
    assert.equal(result.owedBy?.id, "u2");
    assert.equal(result.owedTo?.id, "u1");
  });

  it("reduces balance when settlements are recorded", () => {
    const transactions: Transaction[] = [tx({ id: "1", amount: 1000, paidBy: "u1" })];
    const settlements: Settlement[] = [
      { id: "s1", fromUserId: "u2", toUserId: "u1", amount: 400, date: "2026-11-15" },
    ];

    const result = computeSettlement(transactions, settlements, [alice, bob]);
    assert.equal(result.amount, 0);
    assert.equal(result.owedBy, null);
    assert.equal(result.owedTo, null);
  });
});

describe("summarizeBudgets & summarizeMonth", () => {
  it("separates budgeted vs unbudgeted expenses", () => {
    const transactions: Transaction[] = [
      tx({ id: "1", amount: 300, category: "groceries" }),
      tx({ id: "2", amount: 120, category: "dining" }),
    ];
    const budgets: Budget[] = [{ id: "b1", category: "groceries", amount: 500 }];

    const budgetSummary = summarizeBudgets(transactions, budgets);
    assert.equal(budgetSummary.totalBudget, 500);
    assert.equal(budgetSummary.totalSpent, 300);
    assert.equal(budgetSummary.unbudgetedSpent, 120);
    assert.equal(budgetSummary.overCount, 0);

    const monthSummary = summarizeMonth(transactions, "2026-11", [alice, bob]);
    assert.equal(monthSummary.expenses, 420);
    assert.equal(monthSummary.expenseCount, 2);
  });
});

describe("resolveCategory & parseTransactionsCsv", () => {
  it("maps synonyms and income consistently", () => {
    assert.equal(resolveCategory("Supermarket", "expense"), "groceries");
    assert.equal(resolveCategory("Coffee", "expense"), "dining");
    assert.equal(resolveCategory("Anything", "income"), "income");
  });

  it("parses valid CSV rows and skips malformed ones", () => {
    const csv = [
      "date,description,amount,category,type",
      "2026-11-01,BigBasket,1250,grocery,expense",
      "2026-11-02,Salary,80000,salary,income",
      "invalid-date,Bad Row,100,other,expense",
    ].join("\n");

    const parsed = parseTransactionsCsv(csv);
    assert.equal(parsed.rows.length, 2);
    assert.equal(parsed.skipped, 1);
    assert.equal(parsed.rows[0].category, "groceries");
    assert.equal(parsed.rows[1].type, "income");
  });
});

describe("dates", () => {
  it("validates calendar dates and shifts months accurately", () => {
    assert.equal(isValidISODate("2026-02-29"), false);
    assert.equal(isValidISODate("2024-02-29"), true);
    assert.equal(daysInMonth("2026-02"), 28);
    assert.equal(shiftMonth("2026-01", -1), "2025-12");
  });
});
