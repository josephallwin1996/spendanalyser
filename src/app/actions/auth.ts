"use server";

import { compare, hash } from "bcryptjs";
import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { errorState } from "@/lib/action-state";
import { getCollections } from "@/lib/db";
import { PARTNER_COLORS } from "@/lib/constants";
import { createSession, destroySession } from "@/lib/session";
import type { UserDoc } from "@/lib/types";
import { validationErrors, isDuplicateKeyError, formString } from "@/lib/validation";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name.").max(40, "That name is a little too long."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address.")),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(72, "Keep your password under 72 characters."),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address.")),
  password: z.string().min(1, "Enter your password."),
});

export async function signup(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    name: formString(formData, "name"),
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });

  if (!parsed.success) return validationErrors(parsed.error);

  const { users } = await getCollections();
  const passwordHash = await hash(parsed.data.password, 11);

  let userId: ObjectId;
  try {
    const newUser: UserDoc = {
      _id: new ObjectId(),
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      householdId: null,
      color: PARTNER_COLORS[0],
      createdAt: new Date(),
    };
    const result = await users.insertOne(newUser);
    userId = result.insertedId;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return errorState("An account with this email already exists.", {
        email: "This email is already registered.",
      });
    }
    throw error;
  }

  await createSession(userId.toString());
  redirect("/onboarding");
}

export async function login(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });

  if (!parsed.success) return validationErrors(parsed.error);

  const { users } = await getCollections();
  const user = await users.findOne({ email: parsed.data.email });

  if (!user) return errorState("Incorrect email or password.");
  const valid = await compare(parsed.data.password, user.passwordHash);
  if (!valid) return errorState("Incorrect email or password.");

  await createSession(user._id.toString());
  redirect(user.householdId ? "/dashboard" : "/onboarding");
}

export async function signOut() {
  await destroySession();
  redirect("/login");
}
