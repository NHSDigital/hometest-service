import { z } from "zod";

import {
  FHIRCodeableConceptSchema,
  FHIRObservationSchema,
  FHIRReferenceSchema,
} from "../lib/models/fhir/fhir-schemas";
import { ResultStatus } from "../lib/types/status";

export enum InterpretationCode {
  Normal = "N",
  Abnormal = "A",
}

export const resultCodeMapping: {
  [key in InterpretationCode]: string;
} = {
  [InterpretationCode.Normal]: ResultStatus.Result_Available,
  [InterpretationCode.Abnormal]: ResultStatus.Result_Withheld,
};

export interface Identifiers {
  orderUid: string;
  patientId: string;
  supplierId: string;
  correlationId: string;
}

export interface ResultProcessingHandoffMessage {
  headers: {
    "x-correlation-id": string;
  };
  body: string;
}

// Apply business logic specific to order results on top of schema:
// remove optionality for fields we require and only accept status of 'final'
const orderResultInterpretationCodingSchema = FHIRCodeableConceptSchema.extend({
  coding: z
    .array(
      z.object({
        code: z.enum(["N", "A"]),
      }),
    )
    .min(1),
});

export const orderResultFHIRObservationSchema = FHIRObservationSchema.extend({
  basedOn: z.array(FHIRReferenceSchema),
  status: z.literal("final"),
  subject: FHIRReferenceSchema,
  performer: z.array(FHIRReferenceSchema),
  valueCodeableConcept: FHIRCodeableConceptSchema,
  interpretation: z.array(orderResultInterpretationCodingSchema),
});
