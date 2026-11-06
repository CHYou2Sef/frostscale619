import { describe, it, expect } from "vitest";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  generateSlug,
} from "@/lib/validations/organization";

describe("Organization Validation & Utilities", () => {
  describe("generateSlug", () => {
    it("converts spaces and special characters to URL-safe slug", () => {
      expect(generateSlug("Glacière Moderne de Sfax")).toBe(
        "glaciere-moderne-de-sfax"
      );
    });

    it("handles Arabic/French transliteration and accents", () => {
      expect(generateSlug("Société Écaille & Froid")).toBe(
        "societe-ecaille-froid"
      );
    });

    it("trims trailing dashes", () => {
      expect(generateSlug("---Usine Glace---")).toBe("usine-glace");
    });
  });

  describe("createOrganizationSchema", () => {
    it("accepts valid Tunisian ice factory input", () => {
      const valid = {
        name: "Glacière du Sud",
        legal_name: "Ste Glacière du Sud SARL",
        tax_id: "1234567/A/P/M/000",
        phone: "+216 74 123 456",
        address: "Zone Portuaire de Pêche",
        city: "Sfax",
        ice_types: ["glacons", "ecailles"],
      };

      const result = createOrganizationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects short or empty name", () => {
      const invalid = {
        name: "A",
        ice_types: ["glacons"],
      };

      const result = createOrganizationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects empty ice types selection", () => {
      const invalid = {
        name: "Usine Glace",
        ice_types: [],
      };

      const result = createOrganizationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("updateOrganizationSchema", () => {
    it("validates partial or full update fields", () => {
      const update = {
        name: "Usine Glace Modifiée",
        legal_name: "",
        tax_id: "9876543/B",
        ice_types: ["blocs"],
      };

      const result = updateOrganizationSchema.safeParse(update);
      expect(result.success).toBe(true);
    });
  });
});
