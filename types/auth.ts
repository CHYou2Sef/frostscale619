/**
 * FROSTSCALE619 — Auth types
 *
 * Types used for authentication and authorization across the application.
 */

import type { AppRole, Organization } from "./database";

/** Authenticated user context available on the server side */
export interface AuthUser {
  id: string;
  email: string;
}

/** Tenant context resolved by the server for every protected request */
export interface TenantContext {
  user: AuthUser;
  organization: Organization;
  role: AppRole;
  organizationId: string;
}

/** Result of server-side tenant resolution */
export type TenantResolutionResult =
  | { success: true; context: TenantContext }
  | { success: false; reason: "unauthenticated" | "no_organization" | "no_membership" | "org_not_found" };

/** Action result type for server actions */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
