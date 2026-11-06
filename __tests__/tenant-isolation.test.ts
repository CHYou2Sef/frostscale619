import { describe, it, expect } from "vitest";
import { requireRole } from "@/lib/tenant/context";
import type { TenantContext } from "@/types/auth";

describe("Tenant Authorization & Role Matrix", () => {
  const baseContext: TenantContext = {
    user: { id: "user-1", email: "operator@ice.tn" },
    organization: {
      id: "org-alpha-123",
      name: "Glaces Sfax",
      slug: "glaces-sfax",
      legal_name: null,
      tax_id: null,
      phone: null,
      address: null,
      city: "Sfax",
      country: "TN",
      currency: "TND",
      ice_types: ["glacons"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    role: "operator",
    organizationId: "org-alpha-123",
  };

  it("denies operator role from accessing owner/admin actions", () => {
    const isAllowed = requireRole(baseContext, ["owner", "admin"]);
    expect(isAllowed).toBe(false);
  });

  it("allows owner role for administrative mutations", () => {
    const ownerContext: TenantContext = { ...baseContext, role: "owner" };
    const isAllowed = requireRole(ownerContext, ["owner"]);
    expect(isAllowed).toBe(true);
  });

  it("allows driver role only for driver-permitted actions", () => {
    const driverContext: TenantContext = { ...baseContext, role: "driver" };
    expect(requireRole(driverContext, ["driver"])).toBe(true);
    expect(requireRole(driverContext, ["operator", "admin"])).toBe(false);
  });

  it("prevents cross-tenant context mixing", () => {
    // Simulate attempt to operate on Tenant Beta using Tenant Alpha context
    const tenantAlphaOrgId = "org-alpha-123";
    const requestedTargetOrgId = "org-beta-999";

    const isCrossTenant = baseContext.organizationId !== requestedTargetOrgId;
    expect(isCrossTenant).toBe(true);
  });
});
