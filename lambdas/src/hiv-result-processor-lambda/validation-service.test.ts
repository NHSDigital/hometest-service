import { Observation } from "fhir/r4";

import * as utils from "../lib/utils/utils";
import { InterpretationCode } from "./models";
import * as validation from "./validation-service";

describe("validation-service", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe("extractOrderUidFromFHIRObservation", () => {
    beforeEach(() => {
      jest.spyOn(utils, "isUUID").mockImplementation((id: string) => {
        // Accepts only a specific UUID for test
        return id === "550e8400-e29b-41d4-a716-446655440000";
      });
    });

    it("extracts order UID from valid basedOn reference", () => {
      const observation = {
        basedOn: [{ reference: "ServiceRequest/550e8400-e29b-41d4-a716-446655440000" }],
      } as any;
      const result = validation.extractOrderUidFromFHIRObservation(observation);
      expect(result).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("throws if basedOn is empty array", () => {
      const observation = { basedOn: [] } as any;
      expect(() => validation.extractOrderUidFromFHIRObservation(observation)).toThrow(
        "Observation.basedOn is empty",
      );
    });

    it("throws if basedOn[0].reference is missing", () => {
      const observation = { basedOn: [{}] } as any;
      expect(() => validation.extractOrderUidFromFHIRObservation(observation)).toThrow(
        "Observation.basedOn[0].reference is missing",
      );
    });

    it("throws if basedOn reference format is invalid", () => {
      const observation = { basedOn: [{ reference: "InvalidReferenceFormat" }] } as any;
      expect(() => validation.extractOrderUidFromFHIRObservation(observation)).toThrow(
        "Invalid basedOn reference format",
      );
    });

    it("throws if orderUID is not a valid UUID", () => {
      jest.spyOn(utils, "isUUID").mockReturnValue(false);
      const observation = { basedOn: [{ reference: "ServiceRequest/not-a-uuid" }] } as any;
      expect(() => validation.extractOrderUidFromFHIRObservation(observation)).toThrow(
        "Invalid orderUID format",
      );
    });
  });

  describe("extractPatientIdFromFHIRObservation", () => {
    beforeEach(() => {
      jest.spyOn(utils, "isUUID").mockImplementation((id: string) => {
        // Accepts only a specific UUID for test
        return id === "550e8400-e29b-41d4-a716-446655440001";
      });
    });

    it("extracts patient ID from valid subject reference", () => {
      const observation = {
        subject: { reference: "Patient/550e8400-e29b-41d4-a716-446655440001" },
      } as any;
      const result = validation.extractPatientIdFromFHIRObservation(observation);
      expect(result).toBe("550e8400-e29b-41d4-a716-446655440001");
    });

    it("throws if subject reference format is invalid", () => {
      const observation = {
        subject: { reference: "InvalidReferenceFormat" },
      } as any;
      expect(() => validation.extractPatientIdFromFHIRObservation(observation)).toThrow(
        "Invalid subject reference format",
      );
    });

    it("throws if patient ID is not a valid UUID", () => {
      jest.spyOn(utils, "isUUID").mockReturnValue(false);
      const observation = {
        subject: { reference: "Patient/not-a-uuid" },
      } as any;
      expect(() => validation.extractPatientIdFromFHIRObservation(observation)).toThrow(
        "Invalid patient ID format",
      );
    });
  });

  describe("extractSupplierIdFromFHIRObservation", () => {
    it("extracts supplier ID from valid performer reference", () => {
      const observation = {
        performer: [{ reference: "Organization/supplier-123" }],
      } as any;
      const result = validation.extractSupplierIdFromFHIRObservation(observation);
      expect(result).toBe("supplier-123");
    });

    it("throws if performer reference format is invalid", () => {
      const observation = {
        performer: [{ reference: "InvalidReferenceFormat" }],
      } as any;
      expect(() => validation.extractSupplierIdFromFHIRObservation(observation)).toThrow(
        "Invalid performer reference format",
      );
    });

    it("throws if performer array is missing", () => {
      const observation = {} as any;
      expect(() => validation.extractSupplierIdFromFHIRObservation(observation)).toThrow();
    });

    it("throws if performer[0] is missing", () => {
      const observation = { performer: [] } as any;
      expect(() => validation.extractSupplierIdFromFHIRObservation(observation)).toThrow();
    });

    it("throws if performer[0].reference is missing", () => {
      const observation = { performer: [{}] } as any;
      expect(() => validation.extractSupplierIdFromFHIRObservation(observation)).toThrow();
    });
  });

  describe("extractInterpretationCodeFromFHIRObservation", () => {
    it("extracts interpretation code from valid observation", () => {
      const observation = {
        interpretation: [{ coding: [{ code: "POS" }] }],
      } as any;
      const result = validation.extractInterpretationCodeFromFHIRObservation(observation);
      expect(result).toBe("POS");
    });
  });
});
