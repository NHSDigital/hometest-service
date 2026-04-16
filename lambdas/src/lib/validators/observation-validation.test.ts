import { Observation } from "fhir/r4";

import { ObservationValidation } from "./observation-validation";

describe("ObservationValidation", () => {
  describe("isNormalResult", () => {
    it("should return true for observation with normal (N) interpretation", () => {
      const observation: Observation = {
        resourceType: "Observation",
        status: "final",
        code: { text: "Test" },
        interpretation: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                code: "N",
                display: "Normal",
              },
            ],
          },
        ],
      };

      expect(ObservationValidation.isNormalResult(observation)).toBe(true);
    });

    it("should return false for observation with abnormal (A) interpretation", () => {
      const observation: Observation = {
        resourceType: "Observation",
        status: "final",
        code: { text: "Test" },
        interpretation: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                code: "A",
                display: "Abnormal",
              },
            ],
          },
        ],
      };

      expect(ObservationValidation.isNormalResult(observation)).toBe(false);
    });

    it("should return false for undefined observation", () => {
      expect(ObservationValidation.isNormalResult(undefined)).toBe(false);
    });

    it("should return false for observation without interpretation", () => {
      const observation: Observation = {
        resourceType: "Observation",
        status: "final",
        code: { text: "Test" },
      };

      expect(ObservationValidation.isNormalResult(observation)).toBe(false);
    });

    it("should return false for observation with interpretation but no coding", () => {
      const observation: Observation = {
        resourceType: "Observation",
        status: "final",
        code: { text: "Test" },
        interpretation: [
          {
            text: "Normal",
          },
        ],
      };

      expect(ObservationValidation.isNormalResult(observation)).toBe(false);
    });

    it("should find normal code when it's not the first coding in array", () => {
      const observation: Observation = {
        resourceType: "Observation",
        status: "final",
        code: { text: "Test" },
        interpretation: [
          {
            coding: [
              {
                system: "http://other-system.com",
                code: "OTHER",
                display: "Other",
              },
              {
                system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                code: "N",
                display: "Normal",
              },
            ],
          },
        ],
      };

      expect(ObservationValidation.isNormalResult(observation)).toBe(true);
    });

    it("should find normal code when it's not the first interpretation in array", () => {
      const observation: Observation = {
        resourceType: "Observation",
        status: "final",
        code: { text: "Test" },
        interpretation: [
          {
            coding: [
              {
                system: "http://other-system.com",
                code: "OTHER",
                display: "Other",
              },
            ],
          },
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                code: "N",
                display: "Normal",
              },
            ],
          },
        ],
      };

      expect(ObservationValidation.isNormalResult(observation)).toBe(true);
    });

    it("should return false when coding has correct system but wrong code", () => {
      const observation: Observation = {
        resourceType: "Observation",
        status: "final",
        code: { text: "Test" },
        interpretation: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                code: "H",
                display: "High",
              },
            ],
          },
        ],
      };

      expect(ObservationValidation.isNormalResult(observation)).toBe(false);
    });
  });
});
