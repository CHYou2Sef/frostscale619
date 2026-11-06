/**
 * FROSTSCALE619 — Database types
 *
 * Mirrors the PostgreSQL schema defined in the Phase 1 migration.
 * These types are the single source of truth for the application layer.
 */

// -----------------------------------------------------------------------------
// Enum types (match PostgreSQL enums)
// -----------------------------------------------------------------------------

export type AppRole = "owner" | "admin" | "operator" | "driver";

export type MembershipStatus = "active" | "suspended" | "invited";

export type IceType = "glacons" | "ecailles" | "blocs";

// -----------------------------------------------------------------------------
// Table row types
// -----------------------------------------------------------------------------

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  legal_name: string | null;
  tax_id: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  currency: string;
  ice_types: IceType[];
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: AppRole;
  status: MembershipStatus;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Join / view types (used in UI)
// -----------------------------------------------------------------------------

export interface OrganizationWithRole extends Organization {
  role: AppRole;
}

export interface MemberWithProfile extends OrganizationMember {
  profile: Pick<Profile, "id" | "full_name" | "phone">;
}
