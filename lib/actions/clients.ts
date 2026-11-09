/**
 * FROSTSCALE619 — Client & Logistics Server Actions
 *
 * All operations enforce:
 * - Server-side tenant authorization
 * - Zod schema validation
 * - Row Level Security (RLS)
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveTenantContext, requireRole } from "@/lib/tenant/context";
import {
  createClientSchema,
  updateClientStatusSchema,
  type CreateClientInput,
  type UpdateClientStatusInput,
} from "@/lib/validations/clients";
import { DEFAULT_TUNISIAN_CLIENTS } from "@/lib/data/default-clients";
import type { ActionResult } from "@/types/auth";
import type { Client } from "@/types/database";

/**
 * Retrieves all clients for the active tenant organization.
 * Falls back to default synthetic Tunisian clients if database query fails
 * (e.g. before remote migration is applied) or table is empty.
 */
export async function getClientsAction(): Promise<ActionResult<Client[]>> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Contexte organisationnel introuvable" };
  }

  const { context } = resolved;
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("organization_id", context.organization.id)
      .order("name");

    if (error || !data || data.length === 0) {
      // Return synthetic default clients mapped to the current organization
      const synthetic: Client[] = DEFAULT_TUNISIAN_CLIENTS.map((c) => ({
        ...c,
        organization_id: context.organization.id,
      }));
      return { success: true, data: synthetic };
    }

    return { success: true, data: data as Client[] };
  } catch {
    const synthetic: Client[] = DEFAULT_TUNISIAN_CLIENTS.map((c) => ({
      ...c,
      organization_id: context.organization.id,
    }));
    return { success: true, data: synthetic };
  }
}

/**
 * Creates a new client. Requires owner or admin role.
 */
export async function createClientAction(
  input: CreateClientInput
): Promise<ActionResult<Client>> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée" };
  }

  const { context } = resolved;
  if (!requireRole(context, ["owner", "admin"])) {
    return { success: false, error: "Action non autorisée" };
  }

  const parsed = createClientSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const {
    name,
    category,
    city,
    port_or_zone,
    address,
    latitude,
    longitude,
    phone,
    contact_name,
    tax_id,
    ice_preference,
    containers_balance,
    delivery_status,
    last_order_amount_tnd,
    notes,
  } = parsed.data;

  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .insert({
      organization_id: context.organization.id,
      name,
      slug: `${slug}-${Date.now().toString(36)}`,
      category,
      city,
      port_or_zone: port_or_zone || null,
      address: address || null,
      latitude,
      longitude,
      phone: phone || null,
      contact_name: contact_name || null,
      tax_id: tax_id || null,
      ice_preference,
      containers_balance,
      delivery_status,
      last_order_amount_tnd,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: `Erreur base de données: ${error.message}` };
  }

  return { success: true, data: data as Client };
}

/**
 * Updates client delivery status or container balance.
 */
export async function updateClientStatusAction(
  input: UpdateClientStatusInput
): Promise<ActionResult<void>> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée" };
  }

  const { context } = resolved;
  if (!requireRole(context, ["owner", "admin", "operator"])) {
    return { success: false, error: "Action non autorisée" };
  }

  const parsed = updateClientStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { client_id, delivery_status, containers_balance } = parsed.data;
  const supabase = await createClient();

  const updatePayload: Record<string, unknown> = { delivery_status };
  if (typeof containers_balance === "number") {
    updatePayload.containers_balance = containers_balance;
  }

  const { error } = await supabase
    .from("clients")
    .update(updatePayload)
    .eq("id", client_id)
    .eq("organization_id", context.organization.id);

  if (error) {
    return { success: false, error: `Erreur mise à jour: ${error.message}` };
  }

  return { success: true, data: undefined };
}
