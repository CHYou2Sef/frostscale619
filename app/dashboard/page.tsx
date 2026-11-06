import { redirect } from "next/navigation";
import { resolveTenantContext } from "@/lib/tenant/context";
import { IceFactoryOverview } from "@/components/dashboard/ice-factory-overview";

export const metadata = {
  title: "Tableau de Bord — FrostScale619",
};

export default async function DashboardPage() {
  const result = await resolveTenantContext();

  if (!result.success) {
    if (result.reason === "no_organization") {
      redirect("/onboarding");
    }
    redirect("/auth/login");
  }

  return <IceFactoryOverview context={result.context} />;
}
