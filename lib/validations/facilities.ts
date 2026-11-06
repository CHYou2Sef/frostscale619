/**
 * FROSTSCALE619 — Facilities & Machinery validation schemas
 */

import { z } from "zod";

export const STORAGE_TYPES = ["cold_room", "flake_silo", "buffer_pit"] as const;
export type StorageLocationType = (typeof STORAGE_TYPES)[number];

export const MACHINE_STATUSES = ["operational", "maintenance", "offline"] as const;
export type MachineStatus = (typeof MACHINE_STATUSES)[number];

export const ICE_PRODUCTION_TYPES = ["glacons", "ecailles", "blocs"] as const;
export type IceProductionType = (typeof ICE_PRODUCTION_TYPES)[number];

export const createFacilitySchema = z.object({
  name: z
    .string()
    .min(2, "Le nom de l'installation doit contenir au moins 2 caractères")
    .max(100)
    .trim(),
  code: z
    .string()
    .min(2, "Le code doit contenir au moins 2 caractères (ex: USINE-01)")
    .max(20)
    .trim()
    .toUpperCase(),
  address: z.string().max(300).trim().optional().or(z.literal("")),
  city: z.string().max(100).trim().optional().or(z.literal("")),
});

export const createStorageLocationSchema = z.object({
  facility_id: z.string().uuid("Identifiant d'installation invalide"),
  name: z
    .string()
    .min(2, "Le nom de l'emplacement doit contenir au moins 2 caractères")
    .max(100)
    .trim(),
  type: z.enum(STORAGE_TYPES),
  target_temp_celsius: z
    .number()
    .min(-40, "La température ne peut être inférieure à -40°C")
    .max(15, "La température ne peut dépasser +15°C")
    .default(-5.0),
  capacity_tonnes: z
    .number()
    .positive("La capacité doit être strictement supérieure à 0")
    .max(5000, "Capacité maximale dépassée")
    .default(10.0),
});

export const createMachineSchema = z.object({
  facility_id: z.string().uuid("Identifiant d'installation invalide"),
  name: z
    .string()
    .min(2, "Le nom de la machine doit contenir au moins 2 caractères")
    .max(100)
    .trim(),
  model: z.string().max(100).trim().optional().or(z.literal("")),
  produces_ice_type: z.enum(ICE_PRODUCTION_TYPES),
  capacity_tonnes_per_day: z
    .number()
    .positive("La capacité journalière doit être strictement positive")
    .max(500, "Capacité journalière irréaliste"),
  status: z.enum(MACHINE_STATUSES).default("operational"),
  notes: z.string().max(500).trim().optional().or(z.literal("")),
});

export type CreateFacilityInput = z.infer<typeof createFacilitySchema>;
export type CreateStorageLocationInput = z.infer<typeof createStorageLocationSchema>;
export type CreateMachineInput = z.infer<typeof createMachineSchema>;
