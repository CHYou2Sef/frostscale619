/**
 * FROSTSCALE619 — Organization validation schemas
 *
 * Zod schemas for organization creation and update.
 * Used on both server actions and (optionally) client-side forms.
 */

import { z } from "zod";

/** Valid ice product types for Tunisian ice manufacturers */
export const ICE_TYPES = ["glacons", "ecailles", "blocs"] as const;
export type IceType = (typeof ICE_TYPES)[number];

/** Tunisian governorate cities (most common for ice manufacturers) */
export const TUNISIAN_CITIES = [
  "Tunis",
  "Sfax",
  "Sousse",
  "Bizerte",
  "Nabeul",
  "Kairouan",
  "Gabès",
  "Monastir",
  "Mahdia",
  "Médenine",
  "Tozeur",
  "Gafsa",
  "Kasserine",
  "Jendouba",
  "Béja",
  "Kef",
  "Siliana",
  "Zaghouan",
  "Manouba",
  "Ariana",
  "Ben Arous",
  "Tataouine",
  "Kébili",
  "Sidi Bouzid",
] as const;

/**
 * Generates a URL-safe slug from a company name.
 * Handles French characters common in Tunisian business names.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9]+/g, "-")     // non-alphanum → dash
    .replace(/^-+|-+$/g, "")         // trim dashes
    .substring(0, 63);               // PostgreSQL identifier limit
}

/** Schema for creating a new organization during onboarding */
export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom de l'entreprise doit contenir au moins 2 caractères")
    .max(100, "Le nom de l'entreprise ne peut pas dépasser 100 caractères")
    .trim(),
  legal_name: z
    .string()
    .max(200, "La raison sociale ne peut pas dépasser 200 caractères")
    .trim()
    .optional()
    .or(z.literal("")),
  tax_id: z
    .string()
    .max(50, "Le matricule fiscal ne peut pas dépasser 50 caractères")
    .trim()
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(20, "Le numéro de téléphone ne peut pas dépasser 20 caractères")
    .trim()
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(300, "L'adresse ne peut pas dépasser 300 caractères")
    .trim()
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .max(100, "La ville ne peut pas dépasser 100 caractères")
    .trim()
    .optional()
    .or(z.literal("")),
  ice_types: z
    .array(z.enum(ICE_TYPES))
    .min(1, "Sélectionnez au moins un type de glace")
    .default(["glacons"]),
});

/** Schema for updating an existing organization */
export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom de l'entreprise doit contenir au moins 2 caractères")
    .max(100, "Le nom de l'entreprise ne peut pas dépasser 100 caractères")
    .trim(),
  legal_name: z
    .string()
    .max(200)
    .trim()
    .optional()
    .or(z.literal("")),
  tax_id: z
    .string()
    .max(50)
    .trim()
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(20)
    .trim()
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(300)
    .trim()
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .max(100)
    .trim()
    .optional()
    .or(z.literal("")),
  ice_types: z
    .array(z.enum(ICE_TYPES))
    .min(1, "Sélectionnez au moins un type de glace"),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
