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

const name = "order-router-lambda";

const { httpClient, environmentVariables, supplierDb, secretsClient } = init();

interface ParsedOrderBody {
  supplier_code: string;
  order_body: any;
}

const parseAndValidateRequestBody = (
  eventBody: string | null,
): ParsedOrderBody => {
  let parsedBody: ParsedOrderBody;
  try {
    parsedBody = JSON.parse(eventBody || "");
  } catch {
    throw new HttpError("Invalid JSON in event.body", 400);
  }

  if (
    !parsedBody ||
    typeof parsedBody.supplier_code !== "string" ||
    !isUUID(parsedBody.supplier_code) ||
    typeof parsedBody.order_body !== "object" ||
    parsedBody.order_body === null
  ) {
    throw new HttpError(
      "event.body must match schema { supplier_code: UUID, order_body: JSON }",
      400,
    );
  }

  return parsedBody;
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
