import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { init } from "./init";
import { HttpError } from "../lib/http/http-client";
import { getCorrelationIdFromEventHeaders, isUUID } from "../lib/utils";
import { OAuthSupplierAuthClient } from "../lib/supplier/supplier-auth-client";
import { SupplierConfig } from "src/lib/db/supplier-db";
import { z } from "zod";

const name = "order-router-lambda";

const { httpClient, environmentVariables, supplierDb, secretsClient } = init();

interface ParsedOrderBody {
  supplier_code: string;
  order_body: any;
}

const parseAndValidateRequestBody = (
  eventBody: string | null,
): ParsedOrderBody => {
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(eventBody || "");
  } catch {
    throw new HttpError("Invalid JSON in event.body", 400);
  }

  const result = ParsedOrderBodySchema.safeParse(parsedBody);
  if (!result.success) {
    // Format error as compact JSON array string to avoid issues with newlines in logs
    throw new HttpError(
      `event.body validation error: ${JSON.stringify(result.error.issues)}`,
      400,
    );
  }

  return result.data;
};

const getSupplierServiceConfig = async (
  supplierCode: string,
): Promise<SupplierConfig> => {
  const serviceConfig =
    await supplierDb.getSupplierConfigBySupplierId(supplierCode);
  if (!serviceConfig) {
    throw new HttpError("Supplier not found for supplier_code", 404);
  }

  return serviceConfig;
};

const getSupplierAccessToken = async (
  serviceConfig: SupplierConfig,
): Promise<string> => {
  const supplierAuthClient = new OAuthSupplierAuthClient(
    httpClient,
    secretsClient,
    serviceConfig.serviceUrl,
    serviceConfig.oauthTokenPath,
    serviceConfig.clientId,
    serviceConfig.clientSecretName,
    serviceConfig.oauthScope,
  );

  return await supplierAuthClient.getAccessToken();
};

const sendOrderToSupplier = async (
  serviceConfig: SupplierConfig,
  orderBody: any,
  accessToken: string,
  correlationId: string,
): Promise<{ status: number; body: string; contentType: string }> => {
  // Use a hardcoded path or fetch from serviceConfig if available
  const orderPath = serviceConfig.orderPath || "/order";
  const orderUrl = `${serviceConfig.serviceUrl.replace(/\/$/, "")}${orderPath}`;

  const orderResponse = await httpClient.postRaw(
    orderUrl,
    JSON.stringify(orderBody),
    {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/fhir+json",
      "X-Correlation-ID": correlationId,
    },
    "application/fhir+json",
  );

  const responseText = await orderResponse.text();
  const contentType =
    orderResponse.headers.get("content-type") || "application/fhir+json";

  return {
    status: orderResponse.status,
    body: responseText,
    contentType,
  };
};

export const handler = async (
  event: APIGatewayProxyEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> => {
  try {
    const parsedBody = parseAndValidateRequestBody(event.body);
    const serviceConfig = await getSupplierServiceConfig(
      parsedBody.supplier_code,
    );
    const accessToken = await getSupplierAccessToken(serviceConfig);
    const correlationId = getCorrelationIdFromEventHeaders(event);

    const orderResult = await sendOrderToSupplier(
      serviceConfig,
      parsedBody.order_body,
      accessToken,
      correlationId,
    );

    return {
      statusCode: orderResult.status,
      headers: {
        "Content-Type": orderResult.contentType,
        "X-Correlation-ID": correlationId,
      },
      body: orderResult.body,
    };
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.status : 500;
    return {
      statusCode,
      body: JSON.stringify({
        message: `${name}: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: error instanceof HttpError ? error.body : undefined,
        stack: error instanceof Error ? error.stack : undefined,
      }),
    };
  }
};

// --- FHIR sub-schemas ---
const FHIRCodeableConceptSchema = z.object({
  coding: z.array(
    z.object({
      system: z.string().optional(),
      code: z.string().optional(),
      display: z.string().optional(),
    })
  ).optional(),
  text: z.string().optional(),
});

const FHIRReferenceSchema = z.object({
  reference: z.string(),
  type: z.string().optional(),
  display: z.string().optional(),
});

const FHIRHumanNameSchema = z.object({
  use: z.string().optional(),
  family: z.string(),
  given: z.array(z.string()).optional(),
  text: z.string().optional(),
});

const FHIRContactPointSchema = z.object({
  system: z.enum(["phone", "fax", "email", "pager", "url", "sms", "other"]).optional(),
  value: z.string(),
  use: z.enum(["home", "work", "temp", "old", "mobile"]).optional(),
});

const FHIRAddressSchema = z.object({
  use: z.enum(["home", "work", "temp", "old", "billing"]).optional(),
  type: z.enum(["postal", "physical", "both"]).optional(),
  line: z.array(z.string()),
  city: z.string().optional(),
  postalCode: z.string(),
  country: z.string().optional(),
});

const FHIRContainedPatientSchema = z.object({
  resourceType: z.literal("Patient"),
  id: z.string(),
  name: z.array(FHIRHumanNameSchema),
  telecom: z.array(FHIRContactPointSchema).min(2),
  address: z.array(FHIRAddressSchema),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const FHIRServiceRequestSchema = z.object({
  resourceType: z.literal("ServiceRequest"),
  id: z.string().optional(),
  status: z.enum([
    "draft", "active", "on-hold", "revoked", "completed", "entered-in-error", "unknown"
  ]),
  intent: z.enum([
    "proposal", "plan", "directive", "order", "original-order", "reflex-order", "filler-order", "instance-order", "option"
  ]),
  code: FHIRCodeableConceptSchema,
  contained: z.array(FHIRContainedPatientSchema).min(1),
  subject: FHIRReferenceSchema,
  requester: FHIRReferenceSchema,
  performer: z.array(FHIRReferenceSchema).optional(),
});

// --- Main request schema ---
const ParsedOrderBodySchema = z.object({
  supplier_code: z.string().refine(isUUID, {
    message: "supplier_code must be a valid UUID",
  }),
  order_body: FHIRServiceRequestSchema,
});
