import { describe, it, expect } from "vitest";
import {
  createIceProductSchema,
  updateIceProductSchema,
} from "@/lib/validations/products";

describe("Phase 2: Ice Product Catalog Validation", () => {
  it("validates standard 5kg bag of ice cubes", () => {
    const valid = {
      name: "Sac Glaçons 5kg",
      code: "GLAC-05KG",
      ice_type: "glacons",
      unit: "sac",
      nominal_weight_kg: 5.0,
      unit_price_tnd: 3.5,
    };

    const res = createIceProductSchema.safeParse(valid);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.code).toBe("GLAC-05KG");
      expect(res.data.unit_price_tnd).toBe(3.5);
    }
  });

  it("validates flake ice in bulk per tonne", () => {
    const valid = {
      name: "Glace en Écailles Vrac",
      code: "ECAIL-TONNE",
      ice_type: "ecailles",
      unit: "tonne",
      nominal_weight_kg: 1000.0,
      unit_price_tnd: 120.0,
    };

    const res = createIceProductSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("validates 25kg ice block for shipping", () => {
    const valid = {
      name: "Pain de Glace 25kg",
      code: "BLOC-25KG",
      ice_type: "blocs",
      unit: "bloc",
      nominal_weight_kg: 25.0,
      unit_price_tnd: 8.0,
    };

    const res = createIceProductSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("rejects negative pricing", () => {
    const invalid = {
      name: "Glaçons",
      code: "GLAC-ERR",
      ice_type: "glacons",
      unit: "sac",
      nominal_weight_kg: 2.0,
      unit_price_tnd: -1.0,
    };

    const res = createIceProductSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });
});
