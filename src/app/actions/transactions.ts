"use server";

import { ObjectId } from "mongodb";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { errorState, successState } from "@/lib/action-state";
import { requireHousehold } from "@/lib/auth";
import { CATEGORY_IDS, getCategory, resolveCategory } from "@/lib/categories";
import { getCollections } from "@/lib/db";
import { isValidISODate } from "@/lib/dates";
import { revalidateApp } from "@/lib/revalidate";
import type { ImportRow, TransactionDoc } from "@/lib/types";
import { formString, validationErrors } from "@/lib/validation";

const MAX_AMOUNT = 10_000_000;

const transactionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["expense", "income"]),
  amount: z.coerce
    .number()
    .positive("Enter an amount greater than zero.")
    .max(MAX_AMOUNT, "That amount is too large."),
  description: z
    .string()
    .trim()
    .min(1, "Add a short description.")
    .max(80, "Keep the description under 80 characters."),
  category: z.string().optional(),
  paidBy: z.string().min(1, "Choose who paid."),
  date: z
    .string()
    .refine(isValidISODate, "Enter a valid date.")
    .refine((value) => value >= "2000-01-01" && value <= "2100-12-31", "Enter a valid date."),
  notes: z.string().trim().max(300, "Keep notes under 300 characters.").optional(),
});

export async function saveTransaction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const viewer = await requireHousehold();
  const parsed = transactionSchema.safeParse({
    id: formString(formData, "id") || undefined,
    type: formString(formData, "type") || "expense",
    amount: formString(formData, "amount"),
    description: formString(formData, "description"),
    category: formString(formData, "category"),
    paidBy: formString(formData, "paidBy"),
    date: formString(formData, "date"),
    notes: formString(formData, "notes") || undefined,
  });

  if (!parsed.success) return validationErrors(parsed.error);

  const memberIds = new Set(viewer.members.map((member) => member.id));
  const paidBy = parsed.data.paidBy;
  if (paidBy === "joint") {
    if (parsed.data.type === "income") {
      return errorState("Income needs to belong to one of you.", {
        paidBy: "Choose who received this income.",
      });
    }
  } else if (!memberIds.has(paidBy)) {
    return errorState("Choose who paid from your household.", {
      paidBy: "Choose a valid member.",
    });
  }

  const category = resolveCategory(parsed.data.category, parsed.data.type);
  if (!CATEGORY_IDS.has(category)) {
    return errorState("Choose a category.", { category: "Choose a valid category." });
  }

  const { transactions } = await getCollections();
  const householdId = new ObjectId(viewer.household.id);
  const now = new Date();
  const amount = Math.round(parsed.data.amount * 100) / 100;

  if (parsed.data.id) {
    if (!ObjectId.isValid(parsed.data.id)) return errorState("That transaction could not be found.");
    const result = await transactions.updateOne(
      { _id: new ObjectId(parsed.data.id), householdId },
      {
        $set: {
          type: parsed.data.type,
          amount,
          description: parsed.data.description,
          category,
          paidBy: paidBy === "joint" ? "joint" : new ObjectId(paidBy),
          date: parsed.data.date,
          notes: parsed.data.notes?.trim() || undefined,
        },
      },
    );
    if (result.matchedCount === 0) return errorState("That transaction could not be found.");
    revalidateApp();
    return successState("Transaction updated.");
  }

  const transaction: TransactionDoc = {
    _id: new ObjectId(),
    householdId,
    type: parsed.data.type,
    amount,
    description: parsed.data.description,
    category,
    paidBy: paidBy === "joint" ? "joint" : new ObjectId(paidBy),
    createdBy: new ObjectId(viewer.user.id),
    date: parsed.data.date,
    notes: parsed.data.notes?.trim() || undefined,
    createdAt: now,
  };
  await transactions.insertOne(transaction);

  revalidateApp();
  return successState("Transaction added.");
}

export async function deleteTransaction(id: string): Promise<ActionState> {
  const viewer = await requireHousehold();
  if (!ObjectId.isValid(id)) return errorState("That transaction could not be found.");

  const { transactions } = await getCollections();
  const result = await transactions.deleteOne({
    _id: new ObjectId(id),
    householdId: new ObjectId(viewer.household.id),
  });

  if (result.deletedCount === 0) return errorState("That transaction could not be found.");
  revalidateApp();
  return successState("Transaction deleted.");
}

export async function importTransactions(rows: ImportRow[]): Promise<ActionState> {
  const viewer = await requireHousehold();
  if (!Array.isArray(rows) || rows.length === 0) {
    return errorState("No rows found in that file.");
  }
  if (rows.length > 500) {
    return errorState("Import up to 500 transactions at a time.");
  }

  const { transactions } = await getCollections();
  const memberIds = new Set(viewer.members.map((member) => member.id));
  const householdId = new ObjectId(viewer.household.id);
  const now = Date.now();
  const docs: TransactionDoc[] = [];
  let skipped = 0;

  for (const row of rows) {
    const date = typeof row.date === "string" ? row.date.trim() : "";
    const description = typeof row.description === "string" ? row.description.trim() : "";
    const amount = typeof row.amount === "number" ? row.amount : Number(row.amount);
    const type = row.type === "income" ? "income" : "expense";
    const paidBy = typeof row.paidBy === "string" ? row.paidBy : viewer.user.id;

    if (
      !isValidISODate(date) ||
      !description ||
      description.length > 80 ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > MAX_AMOUNT ||
      !Number.isFinite(amount)
    ) {
      skipped += 1;
      continue;
    }

    if (paidBy !== "joint" ? !memberIds.has(paidBy) : type === "income") {
      skipped += 1;
      continue;
    }

    const category = resolveCategory(row.category, type);
    const existingCategory = getCategory(category);

    docs.push({
      _id: new ObjectId(),
      householdId,
      description,
      amount: Math.round(amount * 100) / 100,
      type,
      category: category === "income" ? "income" : existingCategory.id,
      paidBy: paidBy === "joint" ? "joint" : new ObjectId(paidBy),
      createdBy: new ObjectId(viewer.user.id),
      date,
      createdAt: new Date(now + docs.length),
    });
  }

  if (docs.length === 0) {
    return errorState("None of those rows were valid. Check the date, description and amount columns.");
  }

  await transactions.insertMany(docs);
  revalidateApp();

  const skippedText = skipped > 0 ? ` ${skipped} row${skipped === 1 ? "" : "s"} skipped.` : "";
  return successState(
    `Imported ${docs.length} transaction${docs.length === 1 ? "" : "s"}.${skippedText}`,
    { imported: docs.length, skipped },
  );
}
