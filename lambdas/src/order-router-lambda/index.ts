import { Context, SQSEvent, SQSRecord } from "aws-lambda";
import { init } from "./init";
import { HttpError } from "../lib/http/http-client";
import { getCorrelationIdFromEventHeaders, isUUID } from "../lib/utils";
import { OAuthSupplierAuthClient } from "../lib/supplier/supplier-auth-client";
import { SupplierConfig } from "../lib/db/supplier-db";
import { FHIRServiceRequestSchema } from "../lib/models/fhir/fhir-schemas";
import { FHIRServiceRequest } from "src/lib/models/fhir/FHIRServiceRequestType";
import z from "zod";

const name = "order-router-lambda";

const { httpClient, environmentVariables, supplierDb, secretsClient } = init();

interface ParsedOrderBody {
  supplier_code: string;
  correlation_id: string;
  order_body: FHIRServiceRequest;
}

const ParsedOrderBodySchema = z.object({
  supplier_code: z
    .string()
    .refine(isUUID, { message: "supplier_code must be a valid UUID" }),
  correlation_id: z
    .string()
    .refine(isUUID, { message: "correlation_id must be a valid UUID" }),
  order_body: FHIRServiceRequestSchema,
});

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
  orderBody: FHIRServiceRequest,
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

const processOrderMessage = async (messageBody: string): Promise<void> => {
  try {
    const parsedBody = parseAndValidateRequestBody(messageBody);
    const serviceConfig = await getSupplierServiceConfig(
      parsedBody.supplier_code,
    );
    const accessToken = await getSupplierAccessToken(serviceConfig);
    const correlationId = parsedBody.correlation_id;

    const orderResult = await sendOrderToSupplier(
      serviceConfig,
      parsedBody.order_body,
      accessToken,
      correlationId,
    );

    // Only treat 200/201 as success, otherwise throw error
    if (orderResult.status !== 200 && orderResult.status !== 201) {
      throw new Error(
        JSON.stringify({
          message: `${name}: Order request failed with status: ${orderResult.status}`,
          details: orderResult.body,
        }),
      );
    }
    // Success: do nothing (return void)
  } catch (error) {
    // Always throw for any error, so Lambda can batch fail
    throw new Error(
      typeof error === "string"
        ? error
        : JSON.stringify({
            message: `${name}: ${error instanceof Error ? error.message : "Unknown error"}`,
            details: error instanceof HttpError ? error.body : undefined,
            stack: error instanceof Error ? error.stack : undefined,
          }),
    );
  }
};

export const handler = async (
  event: SQSEvent,
  _context: Context,
): Promise<{ batchItemFailures: { itemIdentifier: string }[] }> => {
  const batchItemFailures: { itemIdentifier: string }[] = [];

  await Promise.all(
    event.Records.map(async (record: SQSRecord) => {
      try {
        await processOrderMessage(record.body);
        // Success: do nothing
      } catch (error) {
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    }),
  );

  return { batchItemFailures };
};
