import { redirect } from "next/navigation";
import { getAuthUser, getUserOrganizations } from "@/lib/tenant/context";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export const metadata = {
  title: "Configuration de votre Entreprise — FrostScale619",
};

export default async function OnboardingPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/auth/login");
  }

  const orgs = await getUserOrganizations();
  // If user already has an organization, redirect to dashboard unless they specifically want to add another
  if (orgs.length > 0) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-2xl">
        <OnboardingForm />
      </div>
    </div>
  );
}
