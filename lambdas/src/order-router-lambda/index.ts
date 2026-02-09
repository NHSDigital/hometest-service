import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { init } from "./init";
import { HttpError } from "../lib/http/http-client";
import { isUUID } from "../lib/utils";
import { OAuthSupplierAuthClient } from "../lib/supplier/supplier-auth-client";

const name = "order-router-lambda";

const { httpClient, environmentVariables, supplierDb, secretsClient } = init();

interface ParsedOrderBody {
  supplier_code: string;
  order_body: any;
}

const validateEnvironmentVariables = (): void => {
  if (
    !environmentVariables.SUPPLIER_OAUTH_TOKEN_PATH ||
    !environmentVariables.SUPPLIER_ORDER_PATH ||
    !environmentVariables.SUPPLIER_CLIENT_ID ||
    !environmentVariables.SUPPLIER_CLIENT_SECRET_NAME ||
    !environmentVariables.DATABASE_URL
  ) {
    throw new HttpError("Missing required configuration", 500);
  }
};

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

const getSupplierServiceUrl = async (supplierCode: string): Promise<string> => {
  const serviceUrl =
    await supplierDb.getSupplierServiceUrlBySupplierId(supplierCode);
  if (!serviceUrl) {
    throw new HttpError("Supplier not found for supplier_code", 404);
  }
  return serviceUrl;
};

const getSupplierAccessToken = async (serviceUrl: string): Promise<string> => {
  const supplierAuthClient = new OAuthSupplierAuthClient(
    httpClient,
    secretsClient,
    serviceUrl,
    environmentVariables.SUPPLIER_OAUTH_TOKEN_PATH!,
    environmentVariables.SUPPLIER_CLIENT_ID!,
    environmentVariables.SUPPLIER_CLIENT_SECRET_NAME!,
    environmentVariables.SUPPLIER_OAUTH_SCOPE,
  );

  return await supplierAuthClient.getAccessToken();
};

const sendOrderToSupplier = async (
  serviceUrl: string,
  orderBody: any,
  accessToken: string,
  correlationId: string,
): Promise<{ status: number; body: string; contentType: string }> => {
  const orderUrl = `${serviceUrl.replace(/\/$/, "")}${environmentVariables.SUPPLIER_ORDER_PATH}`;

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

const getCorrelationId = (event: APIGatewayProxyEvent): string => {
  return (
    event.headers["X-Correlation-ID"] ||
    event.headers["x-correlation-id"] ||
    crypto.randomUUID()
  );
};

export const handler = async (
  event: APIGatewayProxyEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> => {
  try {
    validateEnvironmentVariables();
    const parsedBody = parseAndValidateRequestBody(event.body);
    const serviceUrl = await getSupplierServiceUrl(parsedBody.supplier_code);
    const accessToken = await getSupplierAccessToken(serviceUrl);
    const correlationId = getCorrelationId(event);

    const orderResult = await sendOrderToSupplier(
      serviceUrl,
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
