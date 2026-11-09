import { redirect } from "next/navigation";
import { resolveTenantContext } from "@/lib/tenant/context";
import {
  getStockLevelsAction,
  getInventoryMovementsAction,
} from "@/lib/actions/inventory";
import { getFacilitiesAction } from "@/lib/actions/facilities";
import { getProductsAction } from "@/lib/actions/products";
import { InventoryView } from "@/components/inventory/inventory-view";

export const metadata = {
  title: "Stocks Froids & Grand Livre — FrostScale619",
};

export default async function InventoryPage() {
  const result = await resolveTenantContext();

  if (!result.success) {
    if (result.reason === "no_organization") {
      redirect("/onboarding");
    }
    redirect("/auth/login");
  }

  const [stockRes, movementsRes, facilitiesRes, productsRes] = await Promise.all([
    getStockLevelsAction(),
    getInventoryMovementsAction(),
    getFacilitiesAction(),
    getProductsAction(),
  ]);

  const stockLevels = stockRes.success ? stockRes.data : [];
  const movements = movementsRes.success ? movementsRes.data : [];
  const facilities = facilitiesRes.success ? facilitiesRes.data : [];
  const products = productsRes.success ? productsRes.data : [];

  return (
    <InventoryView
      stockLevels={stockLevels}
      movements={movements}
      facilities={facilities}
      products={products}
      context={result.context}
    />
  );
}
