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
  system: z.enum(["phone", "fax", "email", "pager", "url", "sms", "other"]).optional(),
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

export const FHIRIdentifierSchema = z.object({
  system: z.string().optional(),
  value: z.string(),
  use: z.enum(["usual", "official", "temp", "secondary", "old"]).optional(),
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

export const FHIRTaskSchema = z.looseObject({
  resourceType: z.literal("Task"),
  identifier: z.array(FHIRIdentifierSchema).optional(),
  basedOn: z.array(FHIRReferenceSchema).optional(),
  status: z.enum([
    "draft",
    "requested",
    "received",
    "accepted",
    "rejected",
    "ready",
    "cancelled",
    "in-progress",
    "on-hold",
    "failed",
    "completed",
    "entered-in-error",
  ]),
  intent: z.enum([
    "unknown",
    "proposal",
    "plan",
    "order",
    "original-order",
    "reflex-order",
    "filler-order",
    "instance-order",
    "option",
  ]),
  statusReason: FHIRCodeableConceptSchema.optional(),
  businessStatus: FHIRCodeableConceptSchema.optional(),
  for: FHIRReferenceSchema.optional(),
  authoredOn: z.iso.datetime().optional(),
  lastModified: z.iso.datetime().optional(),
  requester: FHIRReferenceSchema.optional(),
  owner: FHIRReferenceSchema.optional(),
});

// Not a complete FHIR Observation schema implementation,
export const FHIRObservationSchema = z.looseObject({
  resourceType: z.literal("Observation"),
  id: z.string().optional(),
  basedOn: z.array(FHIRReferenceSchema).optional(),
  status: z.enum([
    "registered",
    "preliminary",
    "final",
    "amended",
    "corrected",
    "cancelled",
    "entered-in-error",
    "unknown",
  ]),
  code: FHIRCodeableConceptSchema,
  subject: FHIRReferenceSchema.optional(),
  effectiveDateTime: z.iso.datetime().optional(),
  issued: z.iso.datetime().optional(),
  performer: z.array(FHIRReferenceSchema).optional(),
  valueCodeableConcept: FHIRCodeableConceptSchema.optional(),
  interpretation: z.array(FHIRCodeableConceptSchema).optional(),
});
