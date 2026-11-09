/**
 * FROSTSCALE619 — Client & Logistics Server Actions
 *
 * All operations enforce:
 * - Server-side tenant authorization
 * - Zod schema validation
 * - PostgreSQL Row Level Security (RLS)
 * - Real database synchronization (no mock/fake fallbacks)
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveTenantContext, requireRole } from "@/lib/tenant/context";
import {
  createClientSchema,
  updateClientSchema,
  updateClientStatusSchema,
  type CreateClientInput,
  type UpdateClientInput,
  type UpdateClientStatusInput,
} from "@/lib/validations/clients";
import { DEFAULT_TUNISIAN_CLIENTS } from "@/lib/data/default-clients";
import type { ActionResult } from "@/types/auth";
import type { Client } from "@/types/database";

/**
 * Retrieves all real clients for the active tenant organization from the database.
 */
export async function getClientsAction(): Promise<ActionResult<Client[]>> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Contexte organisationnel introuvable" };
  }

  const { context } = resolved;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("organization_id", context.organization.id)
    .order("name");

  if (error) {
    return {
      success: false,
      error: `Erreur de chargement des clients: ${error.message}. Assurez-vous que la migration Phase 4 a été appliquée.`,
    };
  }

  return { success: true, data: (data as Client[]) || [] };
}

/**
 * Seeds initial Tunisian maritime clients directly into the real database table
 * for the current organization. Useful for quick onboarding without manual entry.
 */
export async function seedDefaultTunisianClientsAction(): Promise<
  ActionResult<Client[]>
> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée" };
  }

  const { context } = resolved;
  if (!requireRole(context, ["owner", "admin"])) {
    return { success: false, error: "Action non autorisée" };
  }

  const supabase = await createClient();

  const clientsToInsert = DEFAULT_TUNISIAN_CLIENTS.map((c) => ({
    organization_id: context.organization.id,
    name: c.name,
    slug: `${c.slug}-${Date.now().toString(36)}`,
    category: c.category,
    city: c.city,
    port_or_zone: c.port_or_zone,
    address: c.address,
    latitude: c.latitude,
    longitude: c.longitude,
    phone: c.phone,
    contact_name: c.contact_name,
    tax_id: c.tax_id,
    ice_preference: c.ice_preference,
    containers_balance: c.containers_balance,
    delivery_status: c.delivery_status,
    last_order_amount_tnd: c.last_order_amount_tnd,
    notes: c.notes,
  }));

  const { data, error } = await supabase
    .from("clients")
    .insert(clientsToInsert)
    .select();

  if (error) {
    return {
      success: false,
      error: `Erreur insertion base de données: ${error.message}`,
    };
  }

  return { success: true, data: data as Client[] };
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
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
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
 * Updates all fields of an existing client (name, category, coordinates, port/zone, contact).
 */
export async function updateClientAction(
  input: UpdateClientInput
): Promise<ActionResult<Client>> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée" };
  }

  const { context } = resolved;
  if (!requireRole(context, ["owner", "admin"])) {
    return { success: false, error: "Action non autorisée" };
  }

  const parsed = updateClientSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  const {
    id,
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
    notes,
  } = parsed.data;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .update({
      name,
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
      notes: notes || null,
    })
    .eq("id", id)
    .eq("organization_id", context.organization.id)
    .select()
    .single();

  if (error || !data) {
    return {
      success: false,
      error: `Impossible de mettre à jour le client: ${error?.message || "Erreur"}`,
    };
  }

  return { success: true, data: data as Client };
}

/**
 * Deletes a client from the database. Requires owner or admin role.
 */
export async function deleteClientAction(
  clientId: string
): Promise<ActionResult<void>> {
  const resolved = await resolveTenantContext();
  if (!resolved.success) {
    return { success: false, error: "Session non autorisée" };
  }

  const { context } = resolved;
  if (!requireRole(context, ["owner", "admin"])) {
    return { success: false, error: "Action non autorisée pour la suppression" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("organization_id", context.organization.id);

  if (error) {
    return {
      success: false,
      error: `Impossible de supprimer le client: ${error.message}. Il est peut-être lié à un historique de ventes existant.`,
    };
  }

  return { success: true, data: undefined };
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
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
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
