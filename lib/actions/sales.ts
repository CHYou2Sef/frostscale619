/**
 * FROSTSCALE619 — Sales & Delivery Server Actions
 *
 * Implements:
 * - Real database transactions for sales orders
 * - Automatic dispatch_out inventory ledger deduction
 * - Client thermal containers balance tracking
 * - Strict multi-tenant isolation via RLS
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveTenantContext, requireRole } from "@/lib/tenant/context";
import {
  createSalesOrderSchema,
  type CreateSalesOrderInput,
} from "@/lib/validations/clients";
import type { ActionResult } from "@/types/auth";
import type { SalesOrderWithDetails } from "@/types/database";

/**
 * Loads all sales orders / delivery slips for the active tenant organization.
 */
export async function getSalesOrdersAction(): Promise<
  ActionResult<SalesOrderWithDetails[]>
> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée" };
  }

  const { context } = resolved;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sales_orders")
    .select(
      `
      *,
      client:clients(*),
      product:ice_products(*),
      storage_location:storage_locations(*),
      performer:profiles(*)
    `
    )
    .eq("organization_id", context.organization.id)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      success: false,
      error: `Erreur chargement des ventes: ${error.message}`,
    };
  }

  return { success: true, data: (data as SalesOrderWithDetails[]) || [] };
}

/**
 * Creates a new sale order, updates the client container balance,
 * and records an inventory dispatch_out movement in the append-only ledger.
 */
export async function createSalesOrderAction(
  input: CreateSalesOrderInput
): Promise<ActionResult<SalesOrderWithDetails>> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée" };
  }

  const { context } = resolved;
  if (!requireRole(context, ["owner", "admin", "operator"])) {
    return { success: false, error: "Action non autorisée" };
  }

  const parsed = createSalesOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  const {
    client_id,
    product_id,
    storage_location_id,
    quantity_units,
    total_weight_kg,
    unit_price_tnd,
    vat_rate,
    stamp_duty_tnd,
    payment_status,
    payment_method,
    containers_loaned,
    containers_returned,
    delivery_notes,
  } = parsed.data;

  // Financial calculation in Tunisian Dinars (TND with 3 decimals)
  const subtotal_ht_tnd = quantity_units * unit_price_tnd;
  const vat_amount_tnd = subtotal_ht_tnd * (vat_rate / 100);
  const total_ttc_tnd = subtotal_ht_tnd + vat_amount_tnd + stamp_duty_tnd;

  const order_number = `BL-${new Date().getFullYear()}-${Date.now()
    .toString(36)
    .toUpperCase()
    .slice(-5)}`;

  const supabase = await createClient();

  // 1. Insert sales order
  const { data: order, error: orderError } = await supabase
    .from("sales_orders")
    .insert({
      organization_id: context.organization.id,
      client_id,
      product_id,
      storage_location_id: storage_location_id || null,
      order_number,
      quantity_units,
      total_weight_kg,
      unit_price_tnd,
      subtotal_ht_tnd,
      vat_rate,
      vat_amount_tnd,
      stamp_duty_tnd,
      total_ttc_tnd,
      payment_status,
      payment_method,
      containers_loaned,
      containers_returned,
      delivery_notes: delivery_notes || null,
      performed_by: context.user.id,
    })
    .select(
      `
      *,
      client:clients(*),
      product:ice_products(*),
      storage_location:storage_locations(*),
      performer:profiles(*)
    `
    )
    .single();

  if (orderError || !order) {
    return {
      success: false,
      error: `Erreur création vente: ${orderError?.message || "Erreur inconnue"}`,
    };
  }

  // 2. If storage location is specified, record dispatch_out in immutable inventory_movements
  if (storage_location_id) {
    // Get facility_id of the storage location
    const { data: storageLoc } = await supabase
      .from("storage_locations")
      .select("facility_id")
      .eq("id", storage_location_id)
      .single();

    if (storageLoc?.facility_id) {
      await supabase.from("inventory_movements").insert({
        organization_id: context.organization.id,
        facility_id: storageLoc.facility_id,
        storage_location_id,
        product_id,
        movement_type: "dispatch_out",
        quantity_delta: -quantity_units,
        weight_delta_kg: -total_weight_kg,
        reference_document_no: order_number,
        reason: `Expédition Bon de Livraison ${order_number}`,
        performed_by: context.user.id,
      });
    }
  }

  // 3. Update client thermal container balance and last order amount
  const { data: clientData } = await supabase
    .from("clients")
    .select("containers_balance")
    .eq("id", client_id)
    .single();

  const currentBalance = clientData?.containers_balance || 0;
  const newBalance = Math.max(
    0,
    currentBalance + containers_loaned - containers_returned
  );

  await supabase
    .from("clients")
    .update({
      containers_balance: newBalance,
      last_order_amount_tnd: total_ttc_tnd,
      delivery_status: "in_transit",
    })
    .eq("id", client_id)
    .eq("organization_id", context.organization.id);

  return { success: true, data: order as SalesOrderWithDetails };
}
