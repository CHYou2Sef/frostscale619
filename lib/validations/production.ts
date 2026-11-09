/**
 * FROSTSCALE619 — Production batch validation schemas
 */

import { z } from "zod";

export const BATCH_STATUSES = ["in_progress", "completed", "cancelled"] as const;

export const startProductionBatchSchema = z.object({
  facility_id: z.string().uuid("Installation invalide"),
  machine_id: z.string().uuid("Machine invalide"),
  product_id: z.string().uuid("Produit invalide"),
  storage_location_id: z.string().uuid("Emplacement de stockage cible invalide"),
  batch_number: z
    .string()
    .min(3, "Le numéro de lot doit contenir au moins 3 caractères")
    .max(50)
    .trim()
    .toUpperCase(),
  notes: z.string().max(500).trim().optional().or(z.literal("")),
});

export const completeProductionBatchSchema = z.object({
  batch_id: z.string().uuid("Identifiant de lot invalide"),
  quantity_units: z
    .number()
    .min(0, "La quantité de pièces/sacs ne peut pas être négative"),
  total_weight_kg: z
    .number()
    .positive("Le poids total produit doit être strictement positif"),
  runtime_hours: z
    .number()
    .min(0.1, "Le temps de fonctionnement de la machine doit être d'au moins 6 minutes (0.1h)")
    .max(24, "Une journée de poste ne peut pas excéder 24h"),
  water_meter_m3: z
    .number()
    .min(0)
    .optional()
    .nullable(),
  electricity_kwh: z
    .number()
    .min(0)
    .optional()
    .nullable(),
  notes: z.string().max(500).trim().optional().or(z.literal("")),
});

export type StartProductionBatchInput = z.infer<typeof startProductionBatchSchema>;
export type CompleteProductionBatchInput = z.infer<typeof completeProductionBatchSchema>;
