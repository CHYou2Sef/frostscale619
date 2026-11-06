/**
 * FROSTSCALE619 — Facilities & Machinery Server Actions
 *
 * All actions strictly enforce server-side tenant isolation and role permissions.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveTenantContext, requireRole } from "@/lib/tenant/context";
import {
  createFacilitySchema,
  createStorageLocationSchema,
  createMachineSchema,
  type CreateFacilityInput,
  type CreateStorageLocationInput,
  type CreateMachineInput,
} from "@/lib/validations/facilities";
import type { ActionResult } from "@/types/auth";
import type {
  Facility,
  FacilityWithDetails,
  StorageLocation,
  Machine,
  MachineStatus,
} from "@/types/database";

/**
 * Loads all facilities with their cold storage rooms and ice machines.
 */
export async function getFacilitiesAction(): Promise<
  ActionResult<FacilityWithDetails[]>
> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée ou expirée." };
  }

  const { organizationId } = resolved.context;
  const supabase = await createClient();

  const { data: facilities, error } = await supabase
    .from("facilities")
    .select(
      `
      *,
      storage_locations (*),
      machines (*)
    `
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading facilities:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: (facilities as FacilityWithDetails[]) || [] };
}

/**
 * Creates a new factory / production site.
 * Restricted to owner and admin roles.
 */
export async function createFacilityAction(
  input: CreateFacilityInput
): Promise<ActionResult<Facility>> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée." };
  }

  if (!requireRole(resolved.context, ["owner", "admin"])) {
    return {
      success: false,
      error: "Droits insuffisants. Seuls les gérants ou administrateurs peuvent créer un site.",
    };
  }

  const parsed = createFacilitySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  const { organizationId } = resolved.context;
  const { name, code, address, city } = parsed.data;

  const supabase = await createClient();
  const { data: facility, error } = await supabase
    .from("facilities")
    .insert({
      organization_id: organizationId,
      name,
      code,
      address: address || null,
      city: city || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: `Le code d'installation "${code}" existe déjà dans votre entreprise.`,
      };
    }
    return { success: false, error: error.message };
  }

  return { success: true, data: facility as Facility };
}

/**
 * Adds a cold storage room, flake silo, or buffer pit to an existing facility.
 */
export async function createStorageLocationAction(
  input: CreateStorageLocationInput
): Promise<ActionResult<StorageLocation>> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée." };
  }

  if (!requireRole(resolved.context, ["owner", "admin"])) {
    return { success: false, error: "Droits insuffisants." };
  }

  const parsed = createStorageLocationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  const { organizationId } = resolved.context;
  const { facility_id, name, type, target_temp_celsius, capacity_tonnes } =
    parsed.data;

  const supabase = await createClient();

  // Verify facility belongs to this tenant
  const { data: facility } = await supabase
    .from("facilities")
    .select("id")
    .eq("id", facility_id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!facility) {
    return { success: false, error: "Installation introuvable." };
  }

  const { data: storage, error } = await supabase
    .from("storage_locations")
    .insert({
      organization_id: organizationId,
      facility_id,
      name,
      type,
      target_temp_celsius,
      capacity_tonnes,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: storage as StorageLocation };
}

/**
 * Adds an ice machine / generator to a facility.
 */
export async function createMachineAction(
  input: CreateMachineInput
): Promise<ActionResult<Machine>> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée." };
  }

  if (!requireRole(resolved.context, ["owner", "admin"])) {
    return { success: false, error: "Droits insuffisants." };
  }

  const parsed = createMachineSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  const { organizationId } = resolved.context;
  const {
    facility_id,
    name,
    model,
    produces_ice_type,
    capacity_tonnes_per_day,
    status,
    notes,
  } = parsed.data;

  const supabase = await createClient();

  // Verify facility belongs to this tenant
  const { data: facility } = await supabase
    .from("facilities")
    .select("id")
    .eq("id", facility_id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!facility) {
    return { success: false, error: "Installation introuvable." };
  }

  const { data: machine, error } = await supabase
    .from("machines")
    .insert({
      organization_id: organizationId,
      facility_id,
      name,
      model: model || null,
      produces_ice_type,
      capacity_tonnes_per_day,
      status,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: machine as Machine };
}

/**
 * Updates a machine's operational status (e.g. En marche, Maintenance, Arrêt).
 */
export async function toggleMachineStatusAction(
  machineId: string,
  newStatus: MachineStatus
): Promise<ActionResult<Machine>> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée." };
  }

  // Operators are also allowed to update machine operational status
  const { organizationId } = resolved.context;
  const supabase = await createClient();

  const { data: machine, error } = await supabase
    .from("machines")
    .update({ status: newStatus })
    .eq("id", machineId)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error || !machine) {
    return { success: false, error: "Impossible de modifier l'état de la machine." };
  }

  return { success: true, data: machine as Machine };
}
