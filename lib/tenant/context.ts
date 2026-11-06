/**
 * FROSTSCALE619 — Server-side tenant context resolution
 *
 * Resolves the authenticated user's active tenant context.
 * Never trusts organization IDs from browser input.
 * Uses cookies + database verification for tenant isolation.
 */

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { TenantContext, TenantResolutionResult } from "@/types/auth";
import type { AppRole, Organization, OrganizationWithRole } from "@/types/database";

const ORG_COOKIE_NAME = "frostscale_org_id";

/**
 * Gets the authenticated user, or null if unauthenticated.
 */
export async function getAuthUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return { id: data.user.id, email: data.user.email ?? "" };
}

/**
 * Resolves the full tenant context for the current request.
 *
 * 1. Authenticate user via Supabase session.
 * 2. Read stored org cookie (never trust browser org_id directly).
 * 3. Verify the user has active membership in that organization.
 * 4. If no cookie or invalid, fall back to user's first organization.
 * 5. If no organizations at all, signal redirect to onboarding.
 */
export async function resolveTenantContext(): Promise<TenantResolutionResult> {
  const user = await getAuthUser();
  if (!user) {
    return { success: false, reason: "unauthenticated" };
  }

  const supabase = await createClient();

  // Fetch all active memberships for this user
  const { data: memberships, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(*)")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (memberError || !memberships || memberships.length === 0) {
    return { success: false, reason: "no_organization" };
  }

  // Read stored org preference from cookie
  const cookieStore = await cookies();
  const storedOrgId = cookieStore.get(ORG_COOKIE_NAME)?.value;

  // Try to find the stored org in memberships
  let activeMembership = storedOrgId
    ? memberships.find((m) => m.organization_id === storedOrgId)
    : null;

  // Fall back to first membership
  if (!activeMembership) {
    activeMembership = memberships[0];
  }

  const org = activeMembership.organizations as unknown as Organization;
  if (!org) {
    return { success: false, reason: "org_not_found" };
  }

  const context: TenantContext = {
    user,
    organization: org,
    role: activeMembership.role as AppRole,
    organizationId: org.id,
  };

  return { success: true, context };
}

/**
 * Gets all organizations the current user belongs to, with their roles.
 */
export async function getUserOrganizations(): Promise<OrganizationWithRole[]> {
  const user = await getAuthUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("role, organizations(*)")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error || !data) return [];

  return data.map((m) => ({
    ...(m.organizations as unknown as Organization),
    role: m.role as AppRole,
  }));
}

/**
 * Sets the active organization cookie (server-side only).
 * Must be called from a Server Action or Route Handler.
 */
export async function setActiveOrganization(organizationId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ORG_COOKIE_NAME, organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

/**
 * Checks if the current user has one of the required roles
 * in the resolved tenant context.
 */
export function requireRole(context: TenantContext, allowedRoles: AppRole[]): boolean {
  return allowedRoles.includes(context.role);
}
