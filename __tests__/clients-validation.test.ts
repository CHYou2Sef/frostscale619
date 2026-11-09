import { describe, it, expect } from "vitest";
import {
  createClientSchema,
  updateClientStatusSchema,
} from "@/lib/validations/clients";

describe("Phase 4: Client & Tracking Validation", () => {
  describe("createClientSchema", () => {
    it("validates valid client with Tunisian coordinates", () => {
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
        last_order_amount_tnd: 850.500,
      };

      const result = createClientSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects coordinates outside Tunisia bounds", () => {
      const invalid = {
        name: "Client Hors Limite",
        category: "poissonnerie" as const,
        city: "Paris",
        latitude: 48.8566, // Outside Tunisia (30 - 38)
        longitude: 2.3522,
        ice_preference: "glacons" as const,
      };

      const result = createClientSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects negative containers balance", () => {
      const invalid = {
        name: "Poissonnerie Centrale",
        category: "poissonnerie" as const,
        city: "Bizerte",
        latitude: 37.2744,
        longitude: 9.8739,
        ice_preference: "glacons" as const,
        containers_balance: -3,
      };

      const result = createClientSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("updateClientStatusSchema", () => {
    it("validates status and container update", () => {
      const valid = {
        client_id: "11111111-1111-4111-8111-111111111111",
        delivery_status: "delivered" as const,
        containers_balance: 8,
      };

      const result = updateClientStatusSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects invalid client UUID", () => {
      const invalid = {
        client_id: "not-a-uuid",
        delivery_status: "idle" as const,
      };

      const result = updateClientStatusSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
