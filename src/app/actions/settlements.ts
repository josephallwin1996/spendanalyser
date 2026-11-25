"use server";

import { ObjectId } from "mongodb";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { errorState, successState } from "@/lib/action-state";
import { requireHousehold } from "@/lib/auth";
import { getCollections } from "@/lib/db";
import { isValidISODate } from "@/lib/dates";
import { revalidateApp } from "@/lib/revalidate";
import type { SettlementDoc } from "@/lib/types";
import { formString, validationErrors } from "@/lib/validation";

const settlementSchema = z.object({
  fromUserId: z.string().min(1),
  toUserId: z.string().min(1),
  amount: z.coerce
    .number()
    .positive("Enter an amount greater than zero.")
    .max(10_000_000, "That amount is too large."),
  date: z.string().refine(isValidISODate, "Enter a valid date."),
  note: z.string().trim().max(120, "Keep the note under 120 characters.").optional(),
});

export async function recordSettlement(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const viewer = await requireHousehold();
  if (viewer.members.length < 2) {
    return errorState("Invite your partner before recording a transfer.");
  }

  const parsed = settlementSchema.safeParse({
    fromUserId: formString(formData, "fromUserId"),
    toUserId: formString(formData, "toUserId"),
    amount: formString(formData, "amount"),
    date: formString(formData, "date"),
    note: formString(formData, "note") || undefined,
  });

  if (!parsed.success) return validationErrors(parsed.error);

  const memberIds = new Set(viewer.members.map((member) => member.id));
  if (
    parsed.data.fromUserId === parsed.data.toUserId ||
    !memberIds.has(parsed.data.fromUserId) ||
    !memberIds.has(parsed.data.toUserId)
  ) {
    return errorState("Choose two different people for the transfer.");
  }

  const { settlements } = await getCollections();
  const settlement: SettlementDoc = {
    _id: new ObjectId(),
    householdId: new ObjectId(viewer.household.id),
    fromUserId: new ObjectId(parsed.data.fromUserId),
    toUserId: new ObjectId(parsed.data.toUserId),
    amount: Math.round(parsed.data.amount * 100) / 100,
    date: parsed.data.date,
    note: parsed.data.note?.trim() || undefined,
    createdAt: new Date(),
  };
  await settlements.insertOne(settlement);

  revalidateApp();
  return successState("Transfer recorded. You're more in sync now.");
}
