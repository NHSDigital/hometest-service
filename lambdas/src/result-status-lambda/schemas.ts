import { z } from "zod";

import {
  FHIRCodeableConceptSchema,
  FHIRIdentifierSchema,
  FHIRReferenceSchema,
  FHIRTaskSchema,
} from "../lib/models/fhir/fhir-schemas";

const resultStatusFHIRCodeableConceptSchema = FHIRCodeableConceptSchema.extend({
  coding: z
    .array(
      z.object({
        system: z.string().optional(),
        code: z.literal("result-available"),
        display: z.string().optional(),
      }),
    )
    .min(1)
    .max(1),
});

export const resultStatusFHIRTaskSchema = FHIRTaskSchema.extend({
  identifier: z.array(FHIRIdentifierSchema).min(1).max(1),
  for: FHIRReferenceSchema,
  businessStatus: resultStatusFHIRCodeableConceptSchema,
  basedOn: z.array(FHIRReferenceSchema),
});
