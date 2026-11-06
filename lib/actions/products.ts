/**
 * FROSTSCALE619 — Ice Products & Catalog Server Actions
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveTenantContext, requireRole } from "@/lib/tenant/context";
import {
  createIceProductSchema,
  updateIceProductSchema,
  type CreateIceProductInput,
  type UpdateIceProductInput,
} from "@/lib/validations/products";
import type { ActionResult } from "@/types/auth";
import type { IceProduct } from "@/types/database";

/**
 * Loads all ice products configured for the current organization.
 */
export async function getProductsAction(): Promise<ActionResult<IceProduct[]>> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée." };
  }

  const { organizationId } = resolved.context;
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("ice_products")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (products as IceProduct[]) || [] };
}

/**
 * Creates a new ice product item (e.g. Sac 5kg Glaçons, Vrac Écailles, Pain 25kg Blocs).
 */
export async function createProductAction(
  input: CreateIceProductInput
): Promise<ActionResult<IceProduct>> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée." };
  }

  if (!requireRole(resolved.context, ["owner", "admin"])) {
    return {
      success: false,
      error: "Droits insuffisants pour gérer le catalogue de vente.",
    };
  }

  const parsed = createIceProductSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  const { organizationId } = resolved.context;
  const { name, code, ice_type, unit, nominal_weight_kg, unit_price_tnd } =
    parsed.data;

  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from("ice_products")
    .insert({
      organization_id: organizationId,
      name,
      code,
      ice_type,
      unit,
      nominal_weight_kg,
      unit_price_tnd,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: `Le code article "${code}" existe déjà dans votre catalogue.`,
      };
    }
    return { success: false, error: error.message };
  }

  return { success: true, data: product as IceProduct };
}

/**
 * Updates an existing ice product.
 */
export async function updateProductAction(
  productId: string,
  input: UpdateIceProductInput
): Promise<ActionResult<IceProduct>> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée." };
  }

  if (!requireRole(resolved.context, ["owner", "admin"])) {
    return { success: false, error: "Droits insuffisants." };
  }

  const parsed = updateIceProductSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  const { organizationId } = resolved.context;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("ice_products")
    .update(parsed.data)
    .eq("id", productId)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error || !product) {
    return { success: false, error: "Impossible de mettre à jour le produit." };
  }

  return { success: true, data: product as IceProduct };
}

/**
 * Toggles product active/archived state.
 */
export async function toggleProductActiveAction(
  productId: string,
  isActive: boolean
): Promise<ActionResult<IceProduct>> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée." };
  }

  if (!requireRole(resolved.context, ["owner", "admin"])) {
    return { success: false, error: "Droits insuffisants." };
  }

  const { organizationId } = resolved.context;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("ice_products")
    .update({ is_active: isActive })
    .eq("id", productId)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error || !product) {
    return { success: false, error: "Impossible de modifier le statut." };
  }

  return { success: true, data: product as IceProduct };
}
