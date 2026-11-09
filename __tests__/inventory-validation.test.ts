import { describe, it, expect } from "vitest";
import {
  recordMeltLossSchema,
  recordTransferSchema,
} from "@/lib/validations/inventory";

describe("Phase 3: Inventory Movements Validation", () => {
  const dummyUUID1 = "11111111-1111-4111-8111-111111111111";
  const dummyUUID2 = "22222222-2222-4222-8222-222222222222";

  describe("recordMeltLossSchema", () => {
    it("validates melt loss declaration (fondue de glace)", () => {
      const valid = {
        facility_id: dummyUUID1,
        storage_location_id: dummyUUID1,
        product_id: dummyUUID1,
        quantity_units: 5,
        weight_lost_kg: 25.0,
        reason: "Dégivrage régulier chambre froide négative",
      };

      const res = recordMeltLossSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("rejects zero or negative melt loss weight", () => {
      const invalid = {
        facility_id: dummyUUID1,
        storage_location_id: dummyUUID1,
        product_id: dummyUUID1,
        weight_lost_kg: -10.0,
        reason: "Erreur",
      };

      const res = recordMeltLossSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("recordTransferSchema", () => {
    it("validates internal cold transfer between two locations", () => {
      const valid = {
        facility_id: dummyUUID1,
        from_storage_location_id: dummyUUID1,
        to_storage_location_id: dummyUUID2,
        product_id: dummyUUID1,
        quantity_units: 50,
        weight_kg: 250.0,
        reason: "Transfert vers chambre tampon expédition",
      };

      const res = recordTransferSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("rejects transfer where source and destination are the same location", () => {
      const invalid = {
        facility_id: dummyUUID1,
        from_storage_location_id: dummyUUID1,
        to_storage_location_id: dummyUUID1, // Same ID!
        product_id: dummyUUID1,
        quantity_units: 10,
        weight_kg: 50.0,
      };

      const res = recordTransferSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });
});
