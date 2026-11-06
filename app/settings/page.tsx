import { redirect } from "next/navigation";
import { resolveTenantContext } from "@/lib/tenant/context";
import { CompanySettingsForm } from "@/components/settings/company-settings-form";

export const metadata = {
  title: "Paramètres Entreprise — FrostScale619",
};

export default async function SettingsPage() {
  const result = await resolveTenantContext();

  if (!result.success) {
    if (result.reason === "no_organization") {
      redirect("/onboarding");
    }
    redirect("/auth/login");
  }

  return <CompanySettingsForm context={result.context} />;
}
