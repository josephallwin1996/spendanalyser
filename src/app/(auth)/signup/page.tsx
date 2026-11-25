import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/auth-forms";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create your account",
};

export default async function SignupPage() {
  const viewer = await getViewer();
  if (viewer) redirect(viewer.household ? "/dashboard" : "/onboarding");

  return <SignupForm />;
}
