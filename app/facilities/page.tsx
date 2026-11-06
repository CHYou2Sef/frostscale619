import { redirect } from "next/navigation";
import { resolveTenantContext } from "@/lib/tenant/context";
import { getFacilitiesAction } from "@/lib/actions/facilities";
import { FacilitiesView } from "@/components/facilities/facilities-view";

export const metadata = {
  title: "Installations & Machines — FrostScale619",
};

export default async function FacilitiesPage() {
  const result = await resolveTenantContext();

  if (!result.success) {
    if (result.reason === "no_organization") {
      redirect("/onboarding");
    }
    redirect("/auth/login");
  }

  const facilitiesRes = await getFacilitiesAction();
  const initialFacilities = facilitiesRes.success ? facilitiesRes.data : [];

  return (
    <FacilitiesView
      initialFacilities={initialFacilities}
      context={result.context}
    />
  );
}
