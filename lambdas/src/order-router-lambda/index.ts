import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { init } from "./init";
import { HttpError } from "../lib/http/http-client";
import { isUUID } from "../lib/utils";

const name = "order-router-lambda";

const { httpClient, supplierAuthClient, environmentVariables } = init();

export const handler = async (
  event: APIGatewayProxyEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> => {
  try {
    if (
      !environmentVariables.SUPPLIER_BASE_URL ||
      !environmentVariables.SUPPLIER_CLIENT_ID ||
      !environmentVariables.SUPPLIER_CLIENT_SECRET_NAME
    ) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: `${name}: Missing required configuration`,
        }),
      };
    }

    // Get OAuth token
    const accessToken = await supplierAuthClient.getAccessToken();

    // Parse and validate event.body
    let parsedBody: { supplier_code: string; order_body: any };
    try {
      parsedBody = JSON.parse(event.body || "");
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `${name}: Invalid JSON in event.body`,
        }),
      };
    }

    if (
      !parsedBody ||
      typeof parsedBody.supplier_code !== "string" ||
      !isUUID(parsedBody.supplier_code) ||
      typeof parsedBody.order_body !== "object" ||
      parsedBody.order_body === null
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `${name}: event.body must match schema { supplier_code: UUID, order_body: JSON }`,
        }),
      };
    }

    // Call order endpoint with the token
    const orderUrl = `${environmentVariables.SUPPLIER_BASE_URL.replace(/\/$/, "")}${environmentVariables.SUPPLIER_ORDER_PATH}`;
    const correlationId =
      event.headers["X-Correlation-ID"] ||
      event.headers["x-correlation-id"] ||
      crypto.randomUUID();

    const orderResponse = await httpClient.postRaw(
      orderUrl,
      JSON.stringify(parsedBody.order_body),
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
      statusCode: orderResponse.status,
      headers: {
        "Content-Type": contentType,
        "X-Correlation-ID": correlationId,
      },
      body: responseText,
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
