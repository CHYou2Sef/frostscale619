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

  // 4. Create organization (RLS allows insert for authenticated users)
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
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
    })
    .select()
    .single();

  if (orgError || !org) {
    console.error("Error creating organization:", orgError);
    return { success: false, error: "Impossible de créer l'entreprise. Veuillez réessayer." };
  }

  // 5. Add creator as owner
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: "owner",
      status: "active",
    });

  if (memberError) {
    console.error("Error creating membership:", memberError);
    // Clean up the organization if membership creation failed
    await supabase.from("organizations").delete().eq("id", org.id);
    return { success: false, error: "Impossible de configurer le membre. Veuillez réessayer." };
  }

  // 6. Set the new org as active
  await setActiveOrganization(org.id);

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
