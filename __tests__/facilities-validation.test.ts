import { describe, it, expect } from "vitest";
import {
  createFacilitySchema,
  createStorageLocationSchema,
  createMachineSchema,
} from "@/lib/validations/facilities";

describe("Phase 2: Facilities & Machinery Validation", () => {
  describe("createFacilitySchema", () => {
    it("validates a standard factory production site", () => {
      const valid = {
        name: "Usine Port de Pêche",
        code: "USINE-01",
        address: "Quai Sud, Port de Sfax",
        city: "Sfax",
      };

      const res = createFacilitySchema.safeParse(valid);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.code).toBe("USINE-01");
      }
    });

    it("rejects short or empty code", () => {
      const invalid = {
        name: "Usine",
        code: "U",
      };
      const res = createFacilitySchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("createStorageLocationSchema", () => {
    it("validates cold storage room settings with realistic temperatures", () => {
      const valid = {
        facility_id: "11111111-1111-4111-8111-111111111111",
        name: "Chambre Froide N°1",
        type: "cold_room",
        target_temp_celsius: -18.5,
        capacity_tonnes: 50.0,
      };

      const res = createStorageLocationSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("rejects invalid temperature above +15°C", () => {
      const invalid = {
        facility_id: "11111111-1111-4111-8111-111111111111",
        name: "Chambre Chaude",
        type: "cold_room",
        target_temp_celsius: 35.0,
        capacity_tonnes: 10.0,
      };

      const res = createStorageLocationSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("createMachineSchema", () => {
    it("validates industrial flake ice generator", () => {
      const valid = {
        facility_id: "11111111-1111-4111-8111-111111111111",
        name: "Geneglace F900 H",
        model: "F900 H",
        produces_ice_type: "ecailles",
        capacity_tonnes_per_day: 12.5,
        status: "operational",
      };

      const res = createMachineSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("rejects negative capacity", () => {
      const invalid = {
        facility_id: "11111111-1111-4111-8111-111111111111",
        name: "Machine",
        produces_ice_type: "glacons",
        capacity_tonnes_per_day: -5,
      };

      const res = createMachineSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });
});
