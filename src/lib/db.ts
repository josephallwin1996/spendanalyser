import { MongoClient, type Db, type WithoutId } from "mongodb";
import type { BudgetDoc, HouseholdDoc, TransactionDoc, UserDoc } from "./types";

const globalForMongo = globalThis as unknown as {
  tandemMongoClient?: Promise<MongoClient>;
  tandemIndexes?: Promise<void>;
};

function mongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to .env.local (see .env.example).");
  }
  return uri;
}

function dbName() {
  return process.env.MONGODB_DB || "tandem";
}

function getClient() {
  if (!globalForMongo.tandemMongoClient) {
    const client = new MongoClient(mongoUri(), {
      serverSelectionTimeoutMS: 8_000,
    });
    globalForMongo.tandemMongoClient = client.connect().catch((error) => {
      globalForMongo.tandemMongoClient = undefined;
      throw error;
    });
  }
  return globalForMongo.tandemMongoClient;
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection<WithoutId<UserDoc>>("users").createIndex({ email: 1 }, { unique: true }),
    db.collection<WithoutId<UserDoc>>("users").createIndex({ householdId: 1 }),
    db.collection<WithoutId<HouseholdDoc>>("households").createIndex({ inviteCode: 1 }, { unique: true }),
    db
      .collection<WithoutId<TransactionDoc>>("transactions")
      .createIndex({ householdId: 1, date: -1, createdAt: -1 }),
    db
      .collection<WithoutId<TransactionDoc>>("transactions")
      .createIndex({ householdId: 1, category: 1, date: -1 }),
    db
      .collection<WithoutId<BudgetDoc>>("budgets")
      .createIndex({ householdId: 1, category: 1 }, { unique: true }),
  ]);
}

export async function getDb() {
  const db = (await getClient()).db(dbName());
  if (!globalForMongo.tandemIndexes) {
    globalForMongo.tandemIndexes = ensureIndexes(db).catch((error) => {
      globalForMongo.tandemIndexes = undefined;
      throw error;
    });
  }
  await globalForMongo.tandemIndexes;
  return db;
}

export async function getCollections() {
  const db = await getDb();
  return {
    users: db.collection<UserDoc>("users"),
    households: db.collection<HouseholdDoc>("households"),
    transactions: db.collection<TransactionDoc>("transactions"),
    budgets: db.collection<BudgetDoc>("budgets"),
  };
}
