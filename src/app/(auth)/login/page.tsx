import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/auth-forms";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const viewer = await getViewer();
  if (viewer) redirect(viewer.household ? "/dashboard" : "/onboarding");

  return <LoginForm />;
}
