import { redirect } from "next/navigation";
import { resolveTenantContext } from "@/lib/tenant/context";
import { getProductionBatchesAction } from "@/lib/actions/production";
import { getFacilitiesAction } from "@/lib/actions/facilities";
import { getProductsAction } from "@/lib/actions/products";
import { ProductionView } from "@/components/production/production-view";

export const metadata = {
  title: "Ordres de Fabrication — FrostScale619",
};

export default async function ProductionPage() {
  const result = await resolveTenantContext();

  if (!result.success) {
    if (result.reason === "no_organization") {
      redirect("/onboarding");
    }
    redirect("/auth/login");
  }

  const [batchesRes, facilitiesRes, productsRes] = await Promise.all([
    getProductionBatchesAction(),
    getFacilitiesAction(),
    getProductsAction(),
  ]);

  const batches = batchesRes.success ? batchesRes.data : [];
  const facilities = facilitiesRes.success ? facilitiesRes.data : [];
  const products = productsRes.success ? productsRes.data : [];

  return (
    <ProductionView
      initialBatches={batches}
      facilities={facilities}
      products={products}
      context={result.context}
    />
  );
}
