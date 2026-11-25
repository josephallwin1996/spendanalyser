import { type Filter, ObjectId } from "mongodb";
import { getCollections } from "./db";
import { monthRange } from "./dates";
import type {
  Budget,
  BudgetDoc,
  PublicUser,
  Settlement,
  SettlementDoc,
  Transaction,
  TransactionDoc,
  TxType,
} from "./types";

function serializeTransaction(doc: TransactionDoc): Transaction {
  return {
    id: doc._id.toString(),
    description: doc.description,
    amount: doc.amount,
    type: doc.type,
    category: doc.category,
    paidBy: doc.paidBy === "joint" ? "joint" : doc.paidBy.toString(),
    createdBy: doc.createdBy.toString(),
    date: doc.date,
    notes: doc.notes,
    createdAt: doc.createdAt.toISOString(),
  };
}

function serializeBudget(doc: BudgetDoc): Budget {
  return {
    id: doc._id.toString(),
    category: doc.category,
    amount: doc.amount,
  };
}

function serializeSettlement(doc: SettlementDoc): Settlement {
  return {
    id: doc._id.toString(),
    fromUserId: doc.fromUserId.toString(),
    toUserId: doc.toUserId.toString(),
    amount: doc.amount,
    date: doc.date,
    note: doc.note,
  };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type TransactionFilters = {
  category?: string;
  paidBy?: string;
  type?: TxType;
  query?: string;
};

function objectId(value: string | ObjectId): ObjectId {
  return typeof value === "string" ? new ObjectId(value) : value;
}

export async function getTransactionsForMonth(
  householdId: string | ObjectId,
  month: string,
  filters: TransactionFilters = {},
): Promise<Transaction[]> {
  const { transactions } = await getCollections();
  const { start, end } = monthRange(month);

  const filter: Filter<TransactionDoc> = {
    householdId: objectId(householdId),
    date: { $gte: start, $lte: end },
  };

  if (filters.category) filter.category = filters.category;
  if (filters.type) filter.type = filters.type;
  if (filters.paidBy) {
    filter.paidBy = filters.paidBy === "joint" ? "joint" : new ObjectId(filters.paidBy);
  }
  if (filters.query) {
    filter.description = { $regex: escapeRegex(filters.query.trim()), $options: "i" };
  }

  const docs = await transactions
    .find(filter)
    .sort({ date: -1, createdAt: -1 })
    .limit(500)
    .toArray();

  return docs.map(serializeTransaction);
}

export async function getTransactionsForRange(
  householdId: string | ObjectId,
  start: string,
  end: string,
): Promise<Transaction[]> {
  const { transactions } = await getCollections();
  const docs = await transactions
    .find({ householdId: objectId(householdId), date: { $gte: start, $lte: end } })
    .sort({ date: 1, createdAt: 1 })
    .limit(5000)
    .toArray();
  return docs.map(serializeTransaction);
}

export async function getBudgets(householdId: string | ObjectId): Promise<Budget[]> {
  const { budgets } = await getCollections();
  const docs = await budgets.find({ householdId: objectId(householdId) }).sort({ amount: -1 }).toArray();
  return docs.map(serializeBudget);
}

export async function getSettlementsForMonth(
  householdId: string | ObjectId,
  month: string,
): Promise<Settlement[]> {
  const { settlements } = await getCollections();
  const { start, end } = monthRange(month);
  const docs = await settlements
    .find({ householdId: objectId(householdId), date: { $gte: start, $lte: end } })
    .sort({ date: -1, createdAt: -1 })
    .limit(100)
    .toArray();
  return docs.map(serializeSettlement);
}

export async function getSettlementsForRange(
  householdId: string | ObjectId,
  start: string,
  end: string,
): Promise<Settlement[]> {
  const { settlements } = await getCollections();
  const docs = await settlements
    .find({ householdId: objectId(householdId), date: { $gte: start, $lte: end } })
    .sort({ date: -1, createdAt: -1 })
    .limit(500)
    .toArray();
  return docs.map(serializeSettlement);
}

export function memberName(members: PublicUser[], userId: string) {
  return members.find((member) => member.id === userId)?.name ?? "Former member";
}
