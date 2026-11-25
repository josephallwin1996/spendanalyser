"use server";

import { ObjectId } from "mongodb";
import type { ActionState } from "@/lib/action-state";
import { errorState, successState } from "@/lib/action-state";
import { requireHousehold } from "@/lib/auth";
import { BUDGET_CATEGORIES } from "@/lib/categories";
import { getCollections } from "@/lib/db";
import { revalidateApp } from "@/lib/revalidate";
import { formString } from "@/lib/validation";

const MAX_BUDGET = 10_000_000;

export async function saveBudgets(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await requireHousehold();
  const fields: Record<string, number> = {};

  for (const category of BUDGET_CATEGORIES) {
    const raw = formString(formData, `budget_${category.id}`).trim();
    if (raw === "") {
      fields[category.id] = 0;
      continue;
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > MAX_BUDGET) {
      return errorState("Please fix the highlighted budgets.", {
        [`budget_${category.id}`]: "Enter a budget between 0 and 10,000,000.",
      });
    }
    fields[category.id] = Math.round(value * 100) / 100;
  }

  const { budgets } = await getCollections();
  const householdId = new ObjectId(viewer.household.id);
  const now = new Date();

  const operations = Object.entries(fields)
    .filter(([, amount]) => amount > 0)
    .map(([category, amount]) => ({
      updateOne: {
        filter: { householdId, category },
        update: {
          $set: { amount, updatedAt: now },
          $setOnInsert: { householdId, category },
        },
        upsert: true,
      },
    }));

  if (operations.length > 0) {
    await budgets.bulkWrite(operations);
  }

  const zeroedCategories = Object.entries(fields)
    .filter(([, amount]) => amount === 0)
    .map(([category]) => category);

  if (zeroedCategories.length > 0) {
    await budgets.deleteMany({ householdId, category: { $in: zeroedCategories } });
  }

  revalidateApp();
  return successState("Budgets saved.");
}
