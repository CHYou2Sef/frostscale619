/**
 * FROSTSCALE619 — Inventory & Stock Movements Server Actions
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveTenantContext, requireRole } from "@/lib/tenant/context";
import {
  recordMeltLossSchema,
  recordTransferSchema,
  type RecordMeltLossInput,
  type RecordTransferInput,
} from "@/lib/validations/inventory";
import type { ActionResult } from "@/types/auth";
import type {
  InventoryMovement,
  InventoryMovementWithDetails,
  StockLevelSummary,
} from "@/types/database";

/**
 * Computes current stock balances across all cold rooms and silos.
 * Calculated dynamically from the immutable append-only ledger.
 */
export async function getStockLevelsAction(): Promise<
  ActionResult<StockLevelSummary[]>
> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée." };
  }

  const { organizationId } = resolved.context;
  const supabase = await createClient();

  const { data: movements, error } = await supabase
    .from("inventory_movements")
    .select(
      `
      storage_location_id,
      product_id,
      quantity_delta,
      weight_delta_kg,
      storage_location:storage_locations (id, name, facility:facilities(name)),
      product:ice_products (id, name, ice_type, unit)
    `
    )
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Error computing stock levels:", error);
    return { success: false, error: error.message };
  }

  // Aggregate by storage_location_id + product_id
  const map = new Map<string, StockLevelSummary>();

  for (const m of (movements || []) as any[]) {
    if (!m.storage_location || !m.product) continue;

    const key = `${m.storage_location_id}_${m.product_id}`;
    const existing = map.get(key);

    const qty = Number(m.quantity_delta) || 0;
    const weight = Number(m.weight_delta_kg) || 0;

    if (existing) {
      existing.current_quantity += qty;
      existing.current_weight_kg += weight;
    } else {
      map.set(key, {
        storage_location_id: m.storage_location_id,
        storage_location_name: m.storage_location.name,
        facility_name: m.storage_location.facility?.name || "Usine",
        product_id: m.product_id,
        product_name: m.product.name,
        ice_type: m.product.ice_type,
        unit: m.product.unit,
        current_quantity: qty,
        current_weight_kg: weight,
      });
    }
  }

  return { success: true, data: Array.from(map.values()) };
}

/**
 * Loads recent inventory ledger movements for auditing.
 */
export async function getInventoryMovementsAction(): Promise<
  ActionResult<InventoryMovementWithDetails[]>
> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée." };
  }

  const { organizationId } = resolved.context;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventory_movements")
    .select(
      `
      *,
      facility:facilities (*),
      storage_location:storage_locations (*),
      product:ice_products (*),
      performer:profiles (*)
    `
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: (data as unknown as InventoryMovementWithDetails[]) || [],
  };
}

/**
 * Declares melt loss / waste due to ambient temperature or defrost (*Fondue de glace*).
 */
export async function recordMeltLossAction(
  input: RecordMeltLossInput
): Promise<ActionResult<InventoryMovement>> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée." };
  }

  const parsed = recordMeltLossSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  const { organizationId, user } = resolved.context;
  const { facility_id, storage_location_id, product_id, quantity_units, weight_lost_kg, reason } =
    parsed.data;

  const supabase = await createClient();

  // Insert negative movement into append-only ledger
  const { data: movement, error } = await supabase
    .from("inventory_movements")
    .insert({
      organization_id: organizationId,
      facility_id,
      storage_location_id,
      product_id,
      movement_type: "melt_loss",
      quantity_delta: -Math.abs(quantity_units),
      weight_delta_kg: -Math.abs(weight_lost_kg),
      reason: `Fondue de glace: ${reason}`,
      performed_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: movement as InventoryMovement };
}

/**
 * Transfers stock from one cold storage room / silo to another.
 */
export async function recordTransferAction(
  input: RecordTransferInput
): Promise<ActionResult> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée." };
  }

  const parsed = recordTransferSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  const { organizationId, user } = resolved.context;
  const {
    facility_id,
    from_storage_location_id,
    to_storage_location_id,
    product_id,
    quantity_units,
    weight_kg,
    reason,
  } = parsed.data;

  const supabase = await createClient();
  const transferDocNo = `TRF-${Date.now().toString(36).toUpperCase()}`;

  // 1. Deduct from source storage location
  const { error: errOut } = await supabase.from("inventory_movements").insert({
    organization_id: organizationId,
    facility_id,
    storage_location_id: from_storage_location_id,
    product_id,
    movement_type: "transfer",
    quantity_delta: -Math.abs(quantity_units),
    weight_delta_kg: -Math.abs(weight_kg),
    reference_document_no: transferDocNo,
    reason: reason ? `Transfert sortant: ${reason}` : "Transfert interne sortant",
    performed_by: user.id,
  });

  if (errOut) return { success: false, error: errOut.message };

  // 2. Add to destination storage location
  const { error: errIn } = await supabase.from("inventory_movements").insert({
    organization_id: organizationId,
    facility_id,
    storage_location_id: to_storage_location_id,
    product_id,
    movement_type: "transfer",
    quantity_delta: Math.abs(quantity_units),
    weight_delta_kg: Math.abs(weight_kg),
    reference_document_no: transferDocNo,
    reason: reason ? `Transfert entrant: ${reason}` : "Transfert interne entrant",
    performed_by: user.id,
  });

  if (errIn) return { success: false, error: errIn.message };

  return { success: true, data: undefined };
}
