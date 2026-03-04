import { z } from "zod";
import { isUUID } from "../lib/utils";
import { FHIRAddressSchema, FHIRHumanNameSchema } from "../lib/models/fhir/fhir-schemas";

const TelecomItemSchema = z
  .object({
    phone: z.string().optional(),
    fax: z.string().optional(),
    email: z.string().optional(),
    pager: z.string().optional(),
    url: z.string().optional(),
    sms: z.string().optional(),
    other: z.string().optional(),
  })
  .refine(
    (value) => Object.values(value).some((item) => item !== undefined),
    "telecom item must include at least one contact value",
  );

const PatientNameSchema = z.object({
  family: FHIRHumanNameSchema.shape.family,
  given: FHIRHumanNameSchema.shape.given,
  text: FHIRHumanNameSchema.shape.text,
});

export const OrderServicePatientSchema = z.object({
  family: PatientNameSchema.shape.family,
  given: PatientNameSchema.shape.given,
  text: PatientNameSchema.shape.text,
  telecom: z.array(TelecomItemSchema).min(2),
  address: FHIRAddressSchema,
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nhsNumber: z.string().regex(/^\d{10}$/),
});

export const OrderServiceRequestSchema = z.object({
  testCode: z.string(),
  testDescription: z.string(),
  supplierId: z.string().refine(isUUID, { message: "supplierId must be a valid UUID" }),
  patient: OrderServicePatientSchema,
  consent: z.boolean().refine((value) => value === true, {
    message: "consent must be true",
  }),
});
