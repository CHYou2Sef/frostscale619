import { describe, it, expect } from "vitest";
import {
  startProductionBatchSchema,
  completeProductionBatchSchema,
} from "@/lib/validations/production";

describe("Phase 3: Production Batches Validation", () => {
  const dummyUUID = "11111111-1111-4111-8111-111111111111";

  describe("startProductionBatchSchema", () => {
    it("validates standard production batch launch", () => {
      const valid = {
        facility_id: dummyUUID,
        machine_id: dummyUUID,
        product_id: dummyUUID,
        storage_location_id: dummyUUID,
        batch_number: "LOT-GLAC-20261109-01",
        notes: "Poste matin - début 06h00",
      };

      const res = startProductionBatchSchema.safeParse(valid);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.batch_number).toBe("LOT-GLAC-20261109-01");
      }
    });

    it("rejects short or empty batch number", () => {
      const invalid = {
        facility_id: dummyUUID,
        machine_id: dummyUUID,
        product_id: dummyUUID,
        storage_location_id: dummyUUID,
        batch_number: "L",
      };

      const res = startProductionBatchSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("completeProductionBatchSchema", () => {
    it("validates batch completion with real scale metrics", () => {
      const valid = {
        batch_id: dummyUUID,
        quantity_units: 200,
        total_weight_kg: 1000.0,
        runtime_hours: 7.5,
        water_meter_m3: 1.15,
        electricity_kwh: 85.0,
        notes: "Excellente qualité de glaçons, contrôle pH conforme",
      };

      const res = completeProductionBatchSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("rejects negative runtime or excessive shift hours (>24h)", () => {
      const invalid = {
        batch_id: dummyUUID,
        quantity_units: 100,
        total_weight_kg: 500,
        runtime_hours: 28.0, // Over 24h
      };

      const res = completeProductionBatchSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });

    it("rejects zero or negative weight produced", () => {
      const invalid = {
        batch_id: dummyUUID,
        quantity_units: 0,
        total_weight_kg: 0, // Must be positive
        runtime_hours: 5.0,
      };

      const res = completeProductionBatchSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });
});
