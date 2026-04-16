import { Bundle, CodeableConcept, Extension, Observation } from "fhir/r4";

import { FhirConstants } from "@/lib/utils/fhir-constants";
import { FhirUtils } from "@/lib/utils/fhir-utils";

describe("FhirUtils", () => {
  describe("findResource", () => {
    it("returns the first matching resource from a bundle", () => {
      const bundle: Bundle = {
        resourceType: "Bundle",
        type: "searchset",
        entry: [
          { resource: { resourceType: "Patient", id: "patient-1" } },
          {
            resource: {
              resourceType: "Observation",
              id: "obs-1",
              status: "final",
              code: {
                coding: [{ system: "https://example.test", code: "result" }],
              },
            },
          },
        ],
      };

      const result = FhirUtils.findResource(bundle, "Observation");

      expect(result).toMatchObject({
        resourceType: "Observation",
        id: "obs-1",
      });
    });

    it("returns null when no matching resource exists", () => {
      const bundle: Bundle = {
        resourceType: "Bundle",
        type: "searchset",
        entry: [{ resource: { resourceType: "Patient", id: "patient-1" } }],
      };

      const result = FhirUtils.findResource(bundle, "Observation");

      expect(result).toBeNull();
    });
  });

  describe("findExtension", () => {
    it("returns extension matching url", () => {
      const expected: Extension = {
        url: "https://example.test/target",
        valueString: "value",
      };

      const resource = {
        extension: [{ url: "https://example.test/other" }, expected],
      };

      const result = FhirUtils.findExtension(resource, "https://example.test/target");

      expect(result).toEqual(expected);
    });

    it("returns null when extension is missing", () => {
      const result = FhirUtils.findExtension({}, "https://example.test/target");

      expect(result).toBeNull();
    });
  });

  describe("findCoding", () => {
    it("returns coding matching system", () => {
      const concept: CodeableConcept = {
        coding: [
          { system: "https://example.test/other", code: "X" },
          { system: "https://example.test/target", code: "Y" },
        ],
      };

      const result = FhirUtils.findCoding(concept, "https://example.test/target");

      expect(result).toEqual({
        system: "https://example.test/target",
        code: "Y",
      });
    });

    it("returns null when concept is undefined", () => {
      const result = FhirUtils.findCoding(undefined, "https://example.test/target");

      expect(result).toBeNull();
    });
  });

  describe("findSubExtension", () => {
    it("returns matching sub-extension", () => {
      const extension: Extension = {
        url: "root",
        extension: [
          { url: "first", valueString: "a" },
          { url: "target", valueString: "b" },
        ],
      };

      const result = FhirUtils.findSubExtension(extension, "target");

      expect(result).toEqual({ url: "target", valueString: "b" });
    });

    it("returns null when parent extension is null", () => {
      const result = FhirUtils.findSubExtension(null, "target");

      expect(result).toBeNull();
    });
  });

  describe("findIdentifier", () => {
    it("returns matching identifier", () => {
      const resource = {
        identifier: [
          { system: "https://example.test/other", value: "1" },
          { system: "https://example.test/target", value: "2" },
        ],
      };

      const result = FhirUtils.findIdentifier(resource, "https://example.test/target");

      expect(result).toEqual({
        system: "https://example.test/target",
        value: "2",
      });
    });

    it("returns null when identifier is missing", () => {
      const result = FhirUtils.findIdentifier({}, "https://example.test/target");

      expect(result).toBeNull();
    });
  });

  describe("isNormalObservationResult", () => {
    it("returns true when interpretation has normal coding", () => {
      const observation: Observation = {
        resourceType: "Observation",
        status: "final",
        code: {
          coding: [{ system: "https://example.test", code: "result" }],
        },
        interpretation: [
          {
            coding: [
              {
                system: FhirConstants.OBSERVATION_INTERPRETATION_SYSTEM,
                code: FhirConstants.NORMAL_OBSERVATION_CODE,
              },
            ],
          },
        ],
      };

      const result = FhirUtils.isNormalObservationResult(observation);

      expect(result).toBe(true);
    });

    it("returns false when interpretation is missing", () => {
      const observation: Observation = {
        resourceType: "Observation",
        status: "final",
        code: {
          coding: [{ system: "https://example.test", code: "result" }],
        },
      };

      const result = FhirUtils.isNormalObservationResult(observation);

      expect(result).toBe(false);
    });

    it("returns false when coding is non-normal", () => {
      const observation: Observation = {
        resourceType: "Observation",
        status: "final",
        code: {
          coding: [{ system: "https://example.test", code: "result" }],
        },
        interpretation: [
          {
            coding: [
              {
                system: FhirConstants.OBSERVATION_INTERPRETATION_SYSTEM,
                code: "A",
              },
            ],
          },
        ],
      };

      const result = FhirUtils.isNormalObservationResult(observation);

      expect(result).toBe(false);
    });
  });
});
