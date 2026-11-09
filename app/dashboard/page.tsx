import { redirect } from "next/navigation";
import { resolveTenantContext } from "@/lib/tenant/context";
import { getClientsAction } from "@/lib/actions/clients";
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

  const clientsResult = await getClientsAction();
  const clients = clientsResult.success ? clientsResult.data : [];

  return <IceFactoryOverview context={result.context} clients={clients} />;
}

