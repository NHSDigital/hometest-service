import { Context, SQSEvent, SQSRecord } from "aws-lambda";
import { init } from "./init";
import { isUUID } from "../lib/utils/utils";
import { OAuthSupplierAuthClient } from "../lib/supplier/supplier-auth-client";
import { SupplierConfig } from "../lib/db/supplier-db";
import { FHIRServiceRequestSchema } from "../lib/models/fhir/fhir-schemas";
import { FHIRServiceRequest } from "../lib/models/fhir/fhir-service-request-type";
import { OrderStatusCodes } from "../lib/db/order-status-db";
import z from "zod";

const name = "order-router-lambda";

const { httpClient, supplierDb, secretsClient, orderStatusService } = init();

export interface ParsedOrderBody {
  supplier_code: string;
  correlation_id: string;
  order_body: FHIRServiceRequest;
}

const ParsedOrderBodySchema = z.object({
  supplier_code: z.string().refine(isUUID, { message: "supplier_code must be a valid UUID" }),
  correlation_id: z.string().refine(isUUID, { message: "correlation_id must be a valid UUID" }),
  order_body: FHIRServiceRequestSchema,
});

const parseAndValidateRequestBody = (eventBody: string | null): ParsedOrderBody => {
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(eventBody || "");
  } catch (error) {
    throw new Error("Invalid JSON in event.body", { cause: error });
  }

  const result = ParsedOrderBodySchema.safeParse(parsedBody);
  if (!result.success) {
    // Format error as compact JSON array string to avoid issues with newlines in logs
    throw new Error(`event.body validation error: ${JSON.stringify(result.error.issues)}`);
  }

  // Validate that order_body.id exists
  if (!result.data.order_body.id) {
    throw new Error(`${name}: order_body.id is required but was not provided`);
  }

  return result.data;
};

const getSupplierServiceConfig = async (supplierCode: string): Promise<SupplierConfig> => {
  try {
    const serviceConfig = await supplierDb.getSupplierConfigBySupplierId(supplierCode);
    if (!serviceConfig) {
      throw new Error(`Supplier not found for supplier_code ${supplierCode}`);
    }

    return serviceConfig;
  } catch (error) {
    throw new Error(`${name}: Failed to load supplier config for supplier_code ${supplierCode}`, {
      cause: error,
    });
  }
};

const getSupplierAccessToken = async (serviceConfig: SupplierConfig): Promise<string> => {
  try {
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
  } catch (error) {
    throw new Error(`${name}: Failed to get supplier access token`, {
      cause: error,
    });
  }
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

  try {
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
    const contentType = orderResponse.headers.get("content-type") || "application/fhir+json";

    return {
      status: orderResponse.status,
      body: responseText,
      contentType,
    };
  } catch (error) {
    throw new Error(`${name}: Failed to submit order to supplier at ${orderUrl}`, { cause: error });
  }
};

const processOrderMessage = async (messageBody: string): Promise<void> => {
  try {
    const parsedBody = parseAndValidateRequestBody(messageBody);
    const serviceConfig = await getSupplierServiceConfig(parsedBody.supplier_code);
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
      throw new Error(`${name}: Order request failed with status ${orderResult.status}`, {
        cause: {
          status: orderResult.status,
          body: orderResult.body,
          contentType: orderResult.contentType,
        },
      });
    }

    // Update order status to SUBMITTED after successful submission
    // This is a best-effort update. If it fails, we log the error but do NOT throw.
    // Rationale: The order has already been successfully submitted to the supplier.
    // If we throw here, the SQS message will be retried (at-least-once delivery),
    // causing sendOrderToSupplier() to run again and potentially placing duplicate
    // orders unless the supplier endpoint is idempotent for X-Correlation-ID.
    // Instead, we accept the status update failure and avoid duplicate supplier orders.
    try {
      await orderStatusService.addOrderStatusUpdate({
        orderId: parsedBody.order_body.id!,
        statusCode: OrderStatusCodes.SUBMITTED,
        createdAt: new Date().toISOString(),
        correlationId: correlationId,
      });
    } catch (error) {
      console.error(
        `${name}: Failed to update order status to SUBMITTED for order ${parsedBody.order_body.id}. ` +
          `Order was successfully submitted to supplier with correlation ID ${correlationId}.`,
        error,
      );
      // Do not rethrow - allow the SQS message to succeed to prevent duplicate supplier submissions
    }
  } catch (error) {
    // Always throw for any error, so Lambda can batch fail
    throw new Error(`${name}: Failed to process order message`, {
      cause: error,
    });
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
        console.info(`${name}: Successfully processed message with ID ${record.messageId}`);
      } catch (error) {
        batchItemFailures.push({ itemIdentifier: record.messageId });
        console.error(`${name}: Error processing message with ID ${record.messageId}:`, error);
      }
    }),
  );

  return { batchItemFailures };
};
