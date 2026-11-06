/**
 * FROSTSCALE619 — Database types
 *
 * Mirrors the PostgreSQL schema defined in Phase 1 & Phase 2 migrations.
 * These types are the single source of truth for the application layer.
 */

// -----------------------------------------------------------------------------
// Enum types (match PostgreSQL enums)
// -----------------------------------------------------------------------------

export type AppRole = "owner" | "admin" | "operator" | "driver";

export type MembershipStatus = "active" | "suspended" | "invited";

export type IceType = "glacons" | "ecailles" | "blocs";

export type StorageLocationType = "cold_room" | "flake_silo" | "buffer_pit";

export type MachineStatus = "operational" | "maintenance" | "offline";

export type ProductUnit = "sac" | "kg" | "bloc" | "tonne" | "caisse";

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
// Phase 2: Master Data & Facilities
// -----------------------------------------------------------------------------

export interface Facility {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StorageLocation {
  id: string;
  organization_id: string;
  facility_id: string;
  name: string;
  type: StorageLocationType;
  target_temp_celsius: number;
  capacity_tonnes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Machine {
  id: string;
  organization_id: string;
  facility_id: string;
  name: string;
  model: string | null;
  produces_ice_type: IceType;
  capacity_tonnes_per_day: number;
  status: MachineStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IceProduct {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  ice_type: IceType;
  unit: ProductUnit;
  nominal_weight_kg: number;
  unit_price_tnd: number;
  is_active: boolean;
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

export interface FacilityWithDetails extends Facility {
  storage_locations: StorageLocation[];
  machines: Machine[];
}
