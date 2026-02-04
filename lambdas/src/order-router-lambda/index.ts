import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { getSecretValue } from "../lib/secrets/secrets-manager-client";
import {init} from "./init";
import { FetchHttpClient, HttpError } from "../lib/http/http-client";

const name = "order-router-lambda";

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

const {httpClient} = init()

export const handler = async (
  event: APIGatewayProxyEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> => {
  try {
    const baseUrl = process.env.SUPPLIER_BASE_URL;
    const tokenPath = process.env.SUPPLIER_OAUTH_TOKEN_PATH || "/oauth/token";
    const orderPath = process.env.SUPPLIER_ORDER_PATH || "/order";
    const clientId = process.env.SUPPLIER_CLIENT_ID;
    const secretName = process.env.SUPPLIER_CLIENT_SECRET_NAME;

    if (!baseUrl || !clientId || !secretName) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: `${name}: Missing required configuration`,
        }),
      };
    }

    // Get OAuth token
    const clientSecret = await getSecretValue(secretName, {
      jsonKey: "client_secret",
    });

    const tokenUrl = `${baseUrl.replace(/\/$/, "")}${tokenPath}`;
    const formBody = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    });

    const tokenData = await httpClient.post<OAuthTokenResponse>(
      tokenUrl,
      formBody.toString(),
      { Accept: "application/json" },
      "application/x-www-form-urlencoded",
    );

    const accessToken = tokenData.access_token;

    // Call order endpoint with the token
    const orderUrl = `${baseUrl.replace(/\/$/, "")}${orderPath}`;
    const correlationId =
      event.headers["X-Correlation-ID"] ||
      event.headers["x-correlation-id"] ||
      crypto.randomUUID();

    const orderResponse = await httpClient.postRaw(
      orderUrl,
      event.body || "",
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
