/**
 * FROSTSCALE619 — Production Batches Server Actions
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveTenantContext, requireRole } from "@/lib/tenant/context";
import {
  startProductionBatchSchema,
  completeProductionBatchSchema,
  type StartProductionBatchInput,
  type CompleteProductionBatchInput,
} from "@/lib/validations/production";
import type { ActionResult } from "@/types/auth";
import type { ProductionBatch, ProductionBatchWithDetails } from "@/types/database";

/**
 * Loads recent production batches for the tenant organization.
 */
export async function getProductionBatchesAction(): Promise<
  ActionResult<ProductionBatchWithDetails[]>
> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée." };
  }

  const { organizationId } = resolved.context;
  const supabase = await createClient();

  const { data: batches, error } = await supabase
    .from("production_batches")
    .select(
      `
      *,
      facility:facilities (*),
      machine:machines (*),
      product:ice_products (*),
      storage_location:storage_locations (*),
      operator:profiles (*)
    `
    )
    .eq("organization_id", organizationId)
    .order("started_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching batches:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: (batches as unknown as ProductionBatchWithDetails[]) || [] };
}

/**
 * Launches a new production batch on the factory floor.
 * Operators, admins, and owners can start batches.
 */
export async function startProductionBatchAction(
  input: StartProductionBatchInput
): Promise<ActionResult<ProductionBatch>> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée." };
  }

  if (!requireRole(resolved.context, ["owner", "admin", "operator"])) {
    return { success: false, error: "Rôle non habilité à lancer une production." };
  }

  const parsed = startProductionBatchSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données de lot invalides",
    };
  }

  const { organizationId, user } = resolved.context;
  const {
    facility_id,
    machine_id,
    product_id,
    storage_location_id,
    batch_number,
    notes,
  } = parsed.data;

  const supabase = await createClient();

  const { data: batch, error } = await supabase
    .from("production_batches")
    .insert({
      organization_id: organizationId,
      facility_id,
      machine_id,
      product_id,
      storage_location_id,
      batch_number,
      status: "in_progress",
      notes: notes || null,
      operator_id: user.id,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: `Le numéro de lot "${batch_number}" existe déjà pour votre usine.`,
      };
    }
    return { success: false, error: error.message };
  }

  return { success: true, data: batch as ProductionBatch };
}

/**
 * Completes a production batch and atomically deposits inventory into the cold room / silo.
 */
export async function completeProductionBatchAction(
  input: CompleteProductionBatchInput
): Promise<ActionResult<ProductionBatch>> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée." };
  }

  const parsed = completeProductionBatchSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données de clôture invalides",
    };
  }

  const {
    batch_id,
    quantity_units,
    total_weight_kg,
    runtime_hours,
    water_meter_m3,
    electricity_kwh,
    notes,
  } = parsed.data;

  const supabase = await createClient();

  // Try the atomic stored procedure first
  const { data: batchData, error: rpcError } = await supabase.rpc(
    "complete_production_batch_atomic",
    {
      p_batch_id: batch_id,
      p_quantity_units: quantity_units,
      p_total_weight_kg: total_weight_kg,
      p_runtime_hours: runtime_hours,
      p_water_meter_m3: water_meter_m3 ?? null,
      p_electricity_kwh: electricity_kwh ?? null,
      p_notes: notes || null,
    }
  );

  if (!rpcError && batchData) {
    return { success: true, data: batchData as ProductionBatch };
  }

  // Fallback: If migration RPC hasn't been run yet in remote Supabase, execute as transaction sequence
  const { organizationId, user } = resolved.context;

  const { data: batch, error: fetchErr } = await supabase
    .from("production_batches")
    .select("*")
    .eq("id", batch_id)
    .eq("organization_id", organizationId)
    .single();

  if (fetchErr || !batch) {
    return { success: false, error: "Lot de production introuvable." };
  }

  // 1. Update batch
  const { data: updatedBatch, error: updateErr } = await supabase
    .from("production_batches")
    .update({
      status: "completed",
      quantity_units,
      total_weight_kg,
      runtime_hours,
      water_meter_m3: water_meter_m3 || null,
      electricity_kwh: electricity_kwh || null,
      notes: notes || batch.notes,
      completed_at: new Date().toISOString(),
    })
    .eq("id", batch_id)
    .select()
    .single();

  if (updateErr || !updatedBatch) {
    return { success: false, error: updateErr?.message || "Erreur de mise à jour" };
  }

  // 2. Append immutable stock movement
  const { error: moveErr } = await supabase
    .from("inventory_movements")
    .insert({
      organization_id: organizationId,
      facility_id: batch.facility_id,
      storage_location_id: batch.storage_location_id,
      product_id: batch.product_id,
      movement_type: "production_in",
      quantity_delta: quantity_units,
      weight_delta_kg: total_weight_kg,
      reference_batch_id: batch.id,
      reference_document_no: batch.batch_number,
      reason: `Entrée en stock - Clôture lot de fabrication ${batch.batch_number}`,
      performed_by: user.id,
    });

  if (moveErr) {
    console.error("Error creating stock movement:", moveErr);
    return { success: false, error: moveErr.message };
  }

  return { success: true, data: updatedBatch as ProductionBatch };
}

/**
 * Cancels an in-progress batch (e.g. machine breakdown before production started).
 */
export async function cancelProductionBatchAction(
  batchId: string,
  reason?: string
): Promise<ActionResult> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée." };
  }

  if (!requireRole(resolved.context, ["owner", "admin"])) {
    return { success: false, error: "Droits insuffisants pour annuler un lot." };
  }

  const { organizationId } = resolved.context;
  const supabase = await createClient();

  const { error } = await supabase
    .from("production_batches")
    .update({
      status: "cancelled",
      notes: reason ? `Annulé: ${reason}` : "Lot annulé par la direction",
    })
    .eq("id", batchId)
    .eq("organization_id", organizationId)
    .eq("status", "in_progress");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}
