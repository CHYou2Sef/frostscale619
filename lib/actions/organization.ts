/**
 * FROSTSCALE619 — Organization server actions
 *
 * All mutations go through server actions with:
 * - Zod validation
 * - Server-side authentication check
 * - Tenant isolation via RLS
 * - Role-based authorization
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  generateSlug,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
} from "@/lib/validations/organization";
import { getAuthUser, setActiveOrganization } from "@/lib/tenant/context";
import type { ActionResult } from "@/types/auth";
import type { Organization } from "@/types/database";

/**
 * Creates a new organization and assigns the current user as owner.
 * Used during the onboarding flow.
 */
export async function createOrganizationAction(
  input: CreateOrganizationInput
): Promise<ActionResult<Organization>> {
  // 1. Authenticate
  const user = await getAuthUser();
  if (!user) {
    return { success: false, error: "Vous devez être connecté pour créer une entreprise." };
  }

  // 2. Validate input
  const parsed = createOrganizationSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Données invalides";
    return { success: false, error: firstError };
  }

  const { name, legal_name, tax_id, phone, address, city, ice_types } = parsed.data;

  // 3. Generate unique slug
  let slug = generateSlug(name);
  const supabase = await createClient();

  // Check slug uniqueness, append suffix if needed
  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  // 4. Ensure profile exists for this user (in case auth trigger didn't fire)
  await supabase
    .from("profiles")
    .upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });

  // 5. Generate UUID in advance to avoid RLS chicken-and-egg on RETURNING *
  const orgId = crypto.randomUUID();

  const { error: orgError } = await supabase
    .from("organizations")
    .insert({
      id: orgId,
      name,
      slug,
      legal_name: legal_name || null,
      tax_id: tax_id || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      country: "TN",
      currency: "TND",
      ice_types,
    });

  if (orgError) {
    console.error("Error creating organization:", orgError);
    return {
      success: false,
      error: `Erreur base de données: ${orgError.message || "Impossible de créer l'entreprise."}`,
    };
  }

  // 6. Add creator as owner membership (now user is an active member)
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: orgId,
      user_id: user.id,
      role: "owner",
      status: "active",
    });

  if (memberError) {
    console.error("Error creating membership:", memberError);
    await supabase.from("organizations").delete().eq("id", orgId);
    return {
      success: false,
      error: `Erreur adhésion: ${memberError.message || "Impossible de configurer le propriétaire."}`,
    };
  }

  // 7. Fetch the created organization (now visible under RLS since user is a member)
  const { data: org } = await supabase
    .from("organizations")
    .select()
    .eq("id", orgId)
    .single();

  // 8. Set the new org as active
  await setActiveOrganization(orgId);

  return { success: true, data: org as Organization };
}

/**
 * Updates organization settings.
 * Requires owner or admin role (enforced by RLS + server-side check).
 */
export async function updateOrganizationAction(
  organizationId: string,
  input: UpdateOrganizationInput
): Promise<ActionResult<Organization>> {
  // 1. Authenticate
  const user = await getAuthUser();
  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  // 2. Validate input
  const parsed = updateOrganizationSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Données invalides";
    return { success: false, error: firstError };
  }

  // 3. Verify role server-side (defence in depth beyond RLS)
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { success: false, error: "Vous n'avez pas les permissions nécessaires." };
  }

  // 4. Update (RLS further enforces owner-only updates)
  const { name, legal_name, tax_id, phone, address, city, ice_types } = parsed.data;

  const { data: org, error } = await supabase
    .from("organizations")
    .update({
      name,
      legal_name: legal_name || null,
      tax_id: tax_id || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      ice_types,
    })
    .eq("id", organizationId)
    .select()
    .single();

  if (error || !org) {
    console.error("Error updating organization:", error);
    return { success: false, error: "Impossible de mettre à jour l'entreprise." };
  }

  return { success: true, data: org as Organization };
}

/**
 * Switches the active organization for the current user.
 * Validates membership before setting cookie.
 */
export async function switchOrganizationAction(
  organizationId: string
): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) {
    return { success: false, error: "Vous devez être connecté." };
  }

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) {
    return { success: false, error: "Vous n'êtes pas membre de cette entreprise." };
  }

  await setActiveOrganization(organizationId);
  return { success: true, data: undefined };
}
