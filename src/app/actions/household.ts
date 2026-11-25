"use server";

import { randomInt } from "node:crypto";
import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { errorState, successState } from "@/lib/action-state";
import { requireHousehold, requireViewer } from "@/lib/auth";
import { INVITE_ALPHABET, INVITE_LENGTH, MAX_MEMBERS, PARTNER_COLORS, pickPartnerColor } from "@/lib/constants";
import { getCollections } from "@/lib/db";
import { CURRENCY_CODES, DEFAULT_CURRENCY } from "@/lib/format";
import { revalidateApp } from "@/lib/revalidate";
import type { HouseholdDoc } from "@/lib/types";
import { formString, isDuplicateKeyError, validationErrors } from "@/lib/validation";

const householdSchema = z.object({
  name: z.string().trim().min(2, "Give your household a name.").max(50, "Keep it under 50 characters."),
  currency: z.enum(CURRENCY_CODES as [string, ...string[]]),
});

function makeInviteCode() {
  let code = "";
  for (let index = 0; index < INVITE_LENGTH; index += 1) {
    code += INVITE_ALPHABET[randomInt(0, INVITE_ALPHABET.length)];
  }
  return code;
}

export async function createHousehold(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await requireViewer();
  if (viewer.household) redirect("/dashboard");

  const parsed = householdSchema.safeParse({
    name: formString(formData, "name"),
    currency: formString(formData, "currency") || DEFAULT_CURRENCY,
  });
  if (!parsed.success) return validationErrors(parsed.error);

  const { households, users } = await getCollections();
  const now = new Date();

  let householdId: ObjectId | null = null;
  for (let attempt = 0; attempt < 8 && !householdId; attempt += 1) {
    try {
      const newHousehold: HouseholdDoc = {
        _id: new ObjectId(),
        name: parsed.data.name,
        inviteCode: makeInviteCode(),
        currency: parsed.data.currency,
        createdAt: now,
      };
      const result = await households.insertOne(newHousehold);
      householdId = result.insertedId;
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
    }
  }

  if (!householdId) return errorState("Could not create a household. Please try again.");

  await users.updateOne(
    { _id: new ObjectId(viewer.user.id) },
    {
      $set: {
        householdId,
        color: PARTNER_COLORS[0],
        sharePercent: 100,
      },
    },
  );

  revalidateApp();
  redirect("/dashboard");
}

export async function joinHousehold(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await requireViewer();
  if (viewer.household) redirect("/dashboard");

  const code = formString(formData, "code").trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) {
    return errorState("Enter the 6-character invite code.", {
      code: "Invite codes are 6 characters long.",
    });
  }

  const { households, users } = await getCollections();
  const household = await households.findOne({ inviteCode: code });
  if (!household) {
    return errorState("That invite code doesn't match a household.", {
      code: "Check the code and try again.",
    });
  }

  const existingMembers = await users
    .find({ householdId: household._id })
    .sort({ createdAt: 1 })
    .toArray();

  if (existingMembers.length >= MAX_MEMBERS) {
    return errorState("This household is already full. A couple means two, after all.");
  }

  const color = pickPartnerColor(existingMembers.map((member) => member.color));

  await users.updateOne(
    { _id: new ObjectId(viewer.user.id) },
    { $set: { householdId: household._id, color, sharePercent: 50 } },
  );

  // Guard against concurrent joins exceeding MAX_MEMBERS on standalone MongoDB without transactions.
  const memberCount = await users.countDocuments({ householdId: household._id });
  if (memberCount > MAX_MEMBERS) {
    await users.updateOne(
      { _id: new ObjectId(viewer.user.id) },
      { $set: { householdId: null, color: PARTNER_COLORS[0], sharePercent: 100 } },
    );
    return errorState("This household is already full. A couple means two, after all.");
  }

  await users.updateMany({ householdId: household._id }, { $set: { sharePercent: 50 } });

  revalidateApp();
  redirect("/dashboard");
}

export async function updateHousehold(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const viewer = await requireHousehold();
  const parsed = householdSchema.safeParse({
    name: formString(formData, "name"),
    currency: formString(formData, "currency"),
  });
  if (!parsed.success) return validationErrors(parsed.error);

  const { households } = await getCollections();
  await households.updateOne(
    { _id: new ObjectId(viewer.household.id) },
    { $set: { name: parsed.data.name, currency: parsed.data.currency } },
  );

  revalidateApp();
  revalidatePath("/settings");
  return successState("Household details saved.");
}

export async function updateProfile(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await requireViewer();
  const schema = z.object({
    name: z.string().trim().min(2, "Tell us your name.").max(40, "That name is a little too long."),
  });
  const parsed = schema.safeParse({ name: formString(formData, "name") });
  if (!parsed.success) return validationErrors(parsed.error);

  const { users } = await getCollections();
  await users.updateOne(
    { _id: new ObjectId(viewer.user.id) },
    { $set: { name: parsed.data.name } },
  );

  revalidateApp();
  return successState("Your name is updated.");
}

export async function updateSplit(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await requireHousehold();
  if (viewer.members.length < 2) {
    return errorState("Invite your partner first, then choose how to split shared costs.");
  }

  const schema = z.object({
    shareA: z.coerce
      .number()
      .min(5, "Keep the split between 5% and 95%.")
      .max(95, "Keep the split between 5% and 95%."),
  });
  const parsed = schema.safeParse({ shareA: formString(formData, "shareA") });
  if (!parsed.success) return validationErrors(parsed.error);

  const shareA = Math.round(parsed.data.shareA);
  const shareB = 100 - shareA;
  const requestedFirstId = formString(formData, "firstMemberId");
  const first =
    viewer.members.find((member) => member.id === requestedFirstId) ?? viewer.members[0];
  const second = viewer.members.find((member) => member.id !== first.id) ?? viewer.members[1];
  const { users } = await getCollections();

  await Promise.all([
    users.updateOne(
      { _id: new ObjectId(first.id) },
      { $set: { sharePercent: shareA } },
    ),
    users.updateOne(
      { _id: new ObjectId(second.id) },
      { $set: { sharePercent: shareB } },
    ),
  ]);

  revalidateApp();
  return successState(`Split updated to ${shareA}/${shareB}.`);
}

export async function regenerateInvite(): Promise<ActionState> {
  const viewer = await requireHousehold();
  const { households } = await getCollections();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      await households.updateOne(
        { _id: new ObjectId(viewer.household.id) },
        { $set: { inviteCode: makeInviteCode() } },
      );
      revalidatePath("/settings");
      return successState("New invite code generated.");
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
    }
  }

  return errorState("Could not generate a new code. Please try again.");
}

export async function leaveHousehold(): Promise<ActionState> {
  const viewer = await requireViewer();
  if (!viewer.household) redirect("/onboarding");

  const { users, households } = await getCollections();
  const householdId = new ObjectId(viewer.household.id);
  const userId = new ObjectId(viewer.user.id);

  await users.updateOne(
    { _id: userId },
    { $set: { householdId: null, sharePercent: 100, color: PARTNER_COLORS[0] } },
  );

  const remaining = await users.find({ householdId }).toArray();
  if (remaining.length === 1) {
    await users.updateOne(
      { _id: remaining[0]._id },
      { $set: { sharePercent: 100 } },
    );
  }
  if (remaining.length === 0) {
    await households.deleteOne({ _id: householdId });
  }

  revalidateApp();
  redirect("/onboarding");
}
