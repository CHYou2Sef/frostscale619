import { z } from "zod";

export const clientCategorySchema = z.enum([
  "mareyeur",
  "poissonnerie",
  "chr",
  "peche_artisanale",
  "industriel",
]);

export const deliveryStatusSchema = z.enum([
  "idle",
  "pending",
  "in_transit",
  "delivered",
]);

export const paymentStatusSchema = z.enum(["paid", "pending", "partial"]);
export const paymentMethodSchema = z.enum([
  "comptant",
  "traite",
  "cheque",
  "virement",
]);

export const createClientSchema = z.object({
  name: z.string().min(2, "Le nom du client doit comporter au moins 2 caractères").max(120),
  category: clientCategorySchema,
  city: z.string().min(2, "La ville est requise").max(80),
  port_or_zone: z.string().max(120).optional(),
  address: z.string().max(250).optional(),
  latitude: z
    .number()
    .min(30.0, "La latitude doit être en Tunisie (>= 30.0)")
    .max(38.0, "La latitude doit être en Tunisie (<= 38.0)"),
  longitude: z
    .number()
    .min(7.0, "La longitude doit être en Tunisie (>= 7.0)")
    .max(12.5, "La longitude doit être en Tunisie (<= 12.5)"),
  phone: z.string().max(30).optional(),
  contact_name: z.string().max(100).optional(),
  tax_id: z.string().max(50).optional(),
  ice_preference: z.enum(["glacons", "ecailles", "blocs"]),
  containers_balance: z.number().int().min(0, "Le nombre de bacs ne peut pas être négatif").default(0),
  delivery_status: deliveryStatusSchema.default("idle"),
  last_order_amount_tnd: z.number().min(0).default(0),
  notes: z.string().max(500).optional(),
});

export const updateClientSchema = createClientSchema.extend({
  id: z.string().uuid("ID client invalide"),
});

export const updateClientStatusSchema = z.object({
  client_id: z.string().uuid("ID client invalide"),
  delivery_status: deliveryStatusSchema,
  containers_balance: z.number().int().min(0).optional(),
});

export const createSalesOrderSchema = z.object({
  client_id: z.string().uuid("Sélectionnez un client valide"),
  product_id: z.string().uuid("Sélectionnez un article de glace"),
  storage_location_id: z.string().uuid("Sélectionnez la chambre froide").optional(),
  quantity_units: z.number().positive("La quantité doit être supérieure à 0"),
  total_weight_kg: z.number().positive("Le poids total en kg doit être supérieur à 0"),
  unit_price_tnd: z.number().min(0, "Le prix unitaire ne peut pas être négatif"),
  vat_rate: z.number().min(0).max(100).default(19.0),
  stamp_duty_tnd: z.number().min(0).default(1.0),
  payment_status: paymentStatusSchema.default("pending"),
  payment_method: paymentMethodSchema.default("comptant"),
  containers_loaned: z.number().int().min(0).default(0),
  containers_returned: z.number().int().min(0).default(0),
  delivery_notes: z.string().max(500).optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type UpdateClientStatusInput = z.infer<typeof updateClientStatusSchema>;
export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>;
