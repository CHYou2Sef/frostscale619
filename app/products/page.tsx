import { redirect } from "next/navigation";
import { resolveTenantContext } from "@/lib/tenant/context";
import { getProductsAction } from "@/lib/actions/products";
import { ProductsView } from "@/components/products/products-view";

export const metadata = {
  title: "Catalogue Produits — FrostScale619",
};

export default async function ProductsPage() {
  const result = await resolveTenantContext();

  if (!result.success) {
    if (result.reason === "no_organization") {
      redirect("/onboarding");
    }
    redirect("/auth/login");
  }

  const productsRes = await getProductsAction();
  const initialProducts = productsRes.success ? productsRes.data : [];

  return (
    <ProductsView
      initialProducts={initialProducts}
      context={result.context}
    />
  );
}
