import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { init } from "./init";
import { HttpError } from "../lib/http/http-client";
import { getCorrelationIdFromEventHeaders, isUUID } from "../lib/utils";
import { OAuthSupplierAuthClient } from "../lib/supplier/supplier-auth-client";
import { SupplierConfig } from "../lib/db/supplier-db";
import { ParsedOrderBodySchema } from "../lib/models/fhir/fhir-schemas";

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
