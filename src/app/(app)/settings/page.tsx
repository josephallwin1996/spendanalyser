import type { Metadata } from "next";
import { PageHeading } from "@/components/app-shell/page-heading";
import {
  HouseholdSettingsCard,
  InviteSettingsCard,
  LeaveHouseholdCard,
  ProfileSettingsCard,
  SplitSettingsCard,
} from "@/components/settings/settings-forms";
import { requireHousehold } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const { user, household, members } = await requireHousehold();

  return (
    <div>
      <PageHeading
        eyebrow="Household"
        title="Settings"
        description="Manage your profile, household currency, partner invite code, and fair-share split."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ProfileSettingsCard user={user} />
        <HouseholdSettingsCard household={household} />
        <InviteSettingsCard household={household} members={members} />
        <SplitSettingsCard members={members} />
      </div>

      <div className="mt-4">
        <LeaveHouseholdCard householdName={household.name} />
      </div>
    </div>
  );
}

