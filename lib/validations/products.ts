/**
 * FROSTSCALE619 — Product catalog validation schemas
 *
 * Ice product lines: Glaçons (Cubes), Écailles (Flakes), Blocs (Blocks).
 * Monetary values in TND (Tunisian Dinar) with millimes precision (3 decimal places).
 */

import { z } from "zod";

export const PRODUCT_UNITS = ["sac", "kg", "bloc", "tonne", "caisse"] as const;
export const PRODUCT_ICE_TYPES = ["glacons", "ecailles", "blocs"] as const;

export const createIceProductSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom du produit doit contenir au moins 2 caractères")
    .max(100)
    .trim(),
  code: z
    .string()
    .min(2, "Le code article doit contenir au moins 2 caractères (ex: GLAC-05KG)")
    .max(20)
    .trim()
    .toUpperCase(),
  ice_type: z.enum(PRODUCT_ICE_TYPES),
  unit: z.enum(PRODUCT_UNITS).default("sac"),
  nominal_weight_kg: z
    .number()
    .positive("Le poids nominal doit être strictement positif")
    .max(2000, "Poids supérieur à 2 tonnes non supporté"),
  unit_price_tnd: z
    .number()
    .min(0, "Le prix unitaire ne peut être négatif")
    .max(10000, "Prix unitaire trop élevé"),
});

export const updateIceProductSchema = createIceProductSchema.partial();

export type CreateIceProductInput = z.infer<typeof createIceProductSchema>;
export type UpdateIceProductInput = z.infer<typeof updateIceProductSchema>;
