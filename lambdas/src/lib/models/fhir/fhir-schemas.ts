import { z } from "zod";

// FHIR sub-schemas
export const FHIRCodeableConceptSchema = z.object({
  coding: z
    .array(
      z.object({
        system: z.string().optional(),
        code: z.string().optional(),
        display: z.string().optional(),
      }),
    )
    .optional(),
  text: z.string().optional(),
});

export const FHIRReferenceSchema = z.object({
  reference: z.string(),
  type: z.string().optional(),
  display: z.string().optional(),
});

export const FHIRHumanNameSchema = z.object({
  use: z.string().optional(),
  family: z.string(),
  given: z.array(z.string()).optional(),
  text: z.string().optional(),
});

export const FHIRContactPointSchema = z.object({
  system: z
    .enum(["phone", "fax", "email", "pager", "url", "sms", "other"])
    .optional(),
  value: z.string(),
  use: z.enum(["home", "work", "temp", "old", "mobile"]).optional(),
});

export const FHIRAddressSchema = z.object({
  use: z.enum(["home", "work", "temp", "old", "billing"]).optional(),
  type: z.enum(["postal", "physical", "both"]).optional(),
  line: z.array(z.string()),
  city: z.string().optional(),
  postalCode: z.string(),
  country: z.string().optional(),
});

export const FHIRContainedPatientSchema = z.object({
  resourceType: z.literal("Patient"),
  id: z.string(),
  name: z.array(FHIRHumanNameSchema),
  telecom: z.array(FHIRContactPointSchema).min(2),
  address: z.array(FHIRAddressSchema),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const FHIRServiceRequestSchema = z.object({
  resourceType: z.literal("ServiceRequest"),
  id: z.string().optional(),
  status: z.enum([
    "draft",
    "active",
    "on-hold",
    "revoked",
    "completed",
    "entered-in-error",
    "unknown",
  ]),
  intent: z.enum([
    "proposal",
    "plan",
    "directive",
    "order",
    "original-order",
    "reflex-order",
    "filler-order",
    "instance-order",
    "option",
  ]),
  code: FHIRCodeableConceptSchema,
  contained: z.array(FHIRContainedPatientSchema).min(1),
  subject: FHIRReferenceSchema,
  requester: FHIRReferenceSchema,
  performer: z.array(FHIRReferenceSchema).optional(),
});
