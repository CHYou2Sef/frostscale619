import { redirect } from "next/navigation";
import { resolveTenantContext } from "@/lib/tenant/context";
import { TenantHeader } from "@/components/layout/tenant-header";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await resolveTenantContext();

  if (!result.success) {
    if (result.reason === "unauthenticated") {
      redirect("/auth/login");
    }
    if (result.reason === "no_organization") {
      redirect("/onboarding");
    }
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TenantHeader context={result.context} />
      <main className="flex-1 container mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
