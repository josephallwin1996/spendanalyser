import type { ObjectId } from "mongodb";

export type TxType = "expense" | "income";
export type PaidBy = ObjectId | "joint";

export type UserDoc = {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  householdId: ObjectId | null;
  color: string;
  sharePercent: number;
  createdAt: Date;
};

export type HouseholdDoc = {
  _id: ObjectId;
  name: string;
  inviteCode: string;
  currency: string;
  createdAt: Date;
};

export type TransactionDoc = {
  _id: ObjectId;
  householdId: ObjectId;
  description: string;
  amount: number;
  type: TxType;
  category: string;
  paidBy: PaidBy;
  createdBy: ObjectId;
  date: string;
  notes?: string;
  createdAt: Date;
};

export type BudgetDoc = {
  _id: ObjectId;
  householdId: ObjectId;
  category: string;
  amount: number;
  updatedAt: Date;
};

export type SettlementDoc = {
  _id: ObjectId;
  householdId: ObjectId;
  fromUserId: ObjectId;
  toUserId: ObjectId;
  amount: number;
  date: string;
  note?: string;
  createdAt: Date;
};

// Serializable shapes passed to Client Components.

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  color: string;
  sharePercent: number;
  joinedAt: string;
};

export type PublicHousehold = {
  id: string;
  name: string;
  currency: string;
  inviteCode: string;
  createdAt: string;
};

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: TxType;
  category: string;
  paidBy: string; // member id or "joint"
  createdBy: string;
  date: string;
  notes?: string;
  createdAt: string;
};

export type Budget = {
  id: string;
  category: string;
  amount: number;
};

export type ImportRow = {
  date: string;
  description: string;
  amount: number;
  type: TxType;
  category?: string;
  paidBy: string;
};

export type Settlement = {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  date: string;
  note?: string;
};

export type Viewer = {
  user: PublicUser;
  household: PublicHousehold | null;
  members: PublicUser[];
};

export type HouseholdViewer = Viewer & {
  household: PublicHousehold;
};
