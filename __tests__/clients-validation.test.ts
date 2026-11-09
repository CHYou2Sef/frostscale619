import { describe, it, expect } from "vitest";
import {
  createClientSchema,
  updateClientSchema,
  updateClientStatusSchema,
  createSalesOrderSchema,
} from "@/lib/validations/clients";

describe("Phase 4: Client, Location & Sales Validation", () => {
  const dummyUUID1 = "11111111-1111-4111-8111-111111111111";
  const dummyUUID2 = "22222222-2222-4222-8222-222222222222";

  describe("createClientSchema", () => {
    it("validates client with valid Tunisian coordinates", () => {
      const valid = {
        name: "Comptoir de Marée El Manar",
        category: "mareyeur" as const,
        city: "Sfax",
        port_or_zone: "Port de Pêche de Sfax",
        latitude: 34.7406,
        longitude: 10.7603,
        phone: "+216 74 222 333",
        ice_preference: "ecailles" as const,
        containers_balance: 6,
        delivery_status: "in_transit" as const,
        last_order_amount_tnd: 850.5,
      };

      const result = createClientSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects coordinates outside Tunisia bounds", () => {
      const invalid = {
        name: "Client Hors Limite",
        category: "poissonnerie" as const,
        city: "Paris",
        latitude: 48.8566, // Outside Tunisia bounds (30 - 38)
        longitude: 2.3522,
        ice_preference: "glacons" as const,
      };

      const result = createClientSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("updateClientSchema", () => {
    it("validates update client payload with ID", () => {
      const valid = {
        id: dummyUUID1,
        name: "Poissonnerie Centrale Modifiée",
        category: "poissonnerie" as const,
        city: "Bizerte",
        latitude: 37.2744,
        longitude: 9.8739,
        ice_preference: "ecailles" as const,
        containers_balance: 5,
        delivery_status: "delivered" as const,
        last_order_amount_tnd: 420.0,
      };

      const result = updateClientSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe("createSalesOrderSchema", () => {
    it("validates sales order with TND calculations", () => {
      const valid = {
        client_id: dummyUUID1,
        product_id: dummyUUID2,
        storage_location_id: dummyUUID1,
        quantity_units: 3.5,
        total_weight_kg: 3500,
        unit_price_tnd: 120.0,
        vat_rate: 19.0,
        stamp_duty_tnd: 1.0,
        payment_status: "paid" as const,
        payment_method: "comptant" as const,
        containers_loaned: 6,
        containers_returned: 2,
        delivery_notes: "Livraison chalutier quai nord",
      };

      const result = createSalesOrderSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects non-positive quantities or weights", () => {
      const invalid = {
        client_id: dummyUUID1,
        product_id: dummyUUID2,
        quantity_units: -1,
        total_weight_kg: 0,
        unit_price_tnd: 50.0,
      };

      const result = createSalesOrderSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("updateClientStatusSchema", () => {
    it("validates status and container update", () => {
      const valid = {
        client_id: dummyUUID1,
        delivery_status: "delivered" as const,
        containers_balance: 8,
      };

      const result = updateClientStatusSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});
