/**
 * FROSTSCALE619 — Database types
 *
 * Mirrors the PostgreSQL schema defined in Phase 1, Phase 2, & Phase 3 migrations.
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

export type BatchStatus = "in_progress" | "completed" | "cancelled";

export type InventoryMovementType =
  | "production_in"
  | "dispatch_out"
  | "transfer"
  | "melt_loss"
  | "adjustment";

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
// Phase 3: Production Batches & Append-Only Inventory Movements
// -----------------------------------------------------------------------------

export interface ProductionBatch {
  id: string;
  organization_id: string;
  facility_id: string;
  machine_id: string;
  product_id: string;
  storage_location_id: string;
  batch_number: string;
  status: BatchStatus;
  quantity_units: number;
  total_weight_kg: number;
  runtime_hours: number;
  water_meter_m3: number | null;
  electricity_kwh: number | null;
  notes: string | null;
  operator_id: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  organization_id: string;
  facility_id: string;
  storage_location_id: string;
  product_id: string;
  movement_type: InventoryMovementType;
  quantity_delta: number;
  weight_delta_kg: number;
  reference_batch_id: string | null;
  reference_document_no: string | null;
  reason: string | null;
  performed_by: string;
  created_at: string;
}

// -----------------------------------------------------------------------------
// Join / View types (used in UI)
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

export interface ProductionBatchWithDetails extends ProductionBatch {
  facility: Facility;
  machine: Machine;
  product: IceProduct;
  storage_location: StorageLocation;
  operator: Profile;
}

export interface InventoryMovementWithDetails extends InventoryMovement {
  facility: Facility;
  storage_location: StorageLocation;
  product: IceProduct;
  performer: Profile;
}

export interface StockLevelSummary {
  storage_location_id: string;
  storage_location_name: string;
  facility_name: string;
  product_id: string;
  product_name: string;
  ice_type: IceType;
  unit: ProductUnit;
  current_quantity: number;
  current_weight_kg: number;
}

// =============================================================================
// Phase 4: Clients, Commercial Tracking & Logistics Types
// =============================================================================

export type ClientCategory =
  | "mareyeur"
  | "poissonnerie"
  | "chr"
  | "peche_artisanale"
  | "industriel";

export type DeliveryStatus = "idle" | "pending" | "in_transit" | "delivered";

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  category: ClientCategory;
  city: string;
  port_or_zone?: string | null;
  address?: string | null;
  latitude: number;
  longitude: number;
  phone?: string | null;
  contact_name?: string | null;
  tax_id?: string | null;
  ice_preference: IceType;
  containers_balance: number;
  delivery_status: DeliveryStatus;
  last_order_amount_tnd: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = "paid" | "pending" | "partial";
export type PaymentMethod = "comptant" | "traite" | "cheque" | "virement";

export interface SalesOrder {
  id: string;
  organization_id: string;
  client_id: string;
  product_id: string;
  storage_location_id?: string | null;
  order_number: string;
  quantity_units: number;
  total_weight_kg: number;
  unit_price_tnd: number;
  subtotal_ht_tnd: number;
  vat_rate: number;
  vat_amount_tnd: number;
  stamp_duty_tnd: number;
  total_ttc_tnd: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  containers_loaned: number;
  containers_returned: number;
  delivery_notes?: string | null;
  performed_by: string;
  created_at: string;
  updated_at: string;
}

export interface SalesOrderWithDetails extends SalesOrder {
  client: Client;
  product: IceProduct;
  storage_location?: StorageLocation | null;
  performer?: Profile | null;
}


