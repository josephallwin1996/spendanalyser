import { ObjectId } from "mongodb";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getCollections } from "./db";
import { getSessionUserId } from "./session";
import type {
  HouseholdDoc,
  HouseholdViewer,
  PublicHousehold,
  PublicUser,
  UserDoc,
  Viewer,
} from "./types";

export function serializeUser(user: UserDoc): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    color: user.color,
    joinedAt: user.createdAt.toISOString(),
  };
}

export function serializeHousehold(household: HouseholdDoc): PublicHousehold {
  return {
    id: household._id.toString(),
    name: household.name,
    currency: household.currency,
    inviteCode: household.inviteCode,
    createdAt: household.createdAt.toISOString(),
  };
}

async function loadViewer(): Promise<Viewer | null> {
  const userId = await getSessionUserId();
  if (!userId || !ObjectId.isValid(userId)) return null;

  const { users, households } = await getCollections();
  const user = await users.findOne({ _id: new ObjectId(userId) });
  if (!user) return null;

  let household: PublicHousehold | null = null;
  let members: PublicUser[] = [];

  if (user.householdId) {
    const [householdDoc, memberDocs] = await Promise.all([
      households.findOne({ _id: user.householdId }),
      users.find({ householdId: user.householdId }).sort({ createdAt: 1 }).toArray(),
    ]);

    if (householdDoc) {
      household = serializeHousehold(householdDoc);
      members = memberDocs.map(serializeUser);
    }
  }

  return {
    user: serializeUser(user),
    household,
    members,
  };
}

export const getViewer = cache(loadViewer);

export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

export async function requireHousehold(): Promise<HouseholdViewer> {
  const viewer = await requireViewer();
  if (!viewer.household) redirect("/onboarding");
  return viewer as HouseholdViewer;
}

export async function getMembers(householdId: ObjectId): Promise<PublicUser[]> {
  const { users } = await getCollections();
  const docs = await users.find({ householdId }).sort({ createdAt: 1 }).toArray();
  return docs.map(serializeUser);
}
