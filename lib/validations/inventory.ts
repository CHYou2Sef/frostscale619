/**
 * FROSTSCALE619 — Inventory movements validation schemas
 *
 * Supports append-only stock entries: melt loss (fondue de glace), internal transfers, and adjustments.
 */

import { z } from "zod";

export const INVENTORY_MOVEMENT_TYPES = [
  "production_in",
  "dispatch_out",
  "transfer",
  "melt_loss",
  "adjustment",
] as const;

export const recordMeltLossSchema = z.object({
  facility_id: z.string().uuid("Installation invalide"),
  storage_location_id: z.string().uuid("Chambre froide / Silo invalide"),
  product_id: z.string().uuid("Article de glace invalide"),
  quantity_units: z.number().min(0).default(0),
  weight_lost_kg: z
    .number()
    .positive("Le poids de glace fondue doit être strictement supérieur à 0 kg")
    .max(50000, "Valeur de perte hors normes"),
  reason: z
    .string()
    .min(3, "Veuillez préciser le motif (ex: Dégivrage, Panne compresseur, Chaleur quai)")
    .max(300)
    .trim(),
});

export const recordTransferSchema = z
  .object({
    facility_id: z.string().uuid("Installation invalide"),
    from_storage_location_id: z.string().uuid("Emplacement source invalide"),
    to_storage_location_id: z.string().uuid("Emplacement cible invalide"),
    product_id: z.string().uuid("Article de glace invalide"),
    quantity_units: z.number().min(0).default(0),
    weight_kg: z
    .number()
    .positive("Le poids transféré doit être strictement supérieur à 0 kg"),
    reason: z.string().max(300).trim().optional().or(z.literal("")),
  })
  .refine(
    (data) => data.from_storage_location_id !== data.to_storage_location_id,
    {
      message: "L'emplacement source et l'emplacement cible doivent être différents",
      path: ["to_storage_location_id"],
    }
  );

export type RecordMeltLossInput = z.infer<typeof recordMeltLossSchema>;
export type RecordTransferInput = z.infer<typeof recordTransferSchema>;
