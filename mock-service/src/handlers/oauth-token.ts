import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { jsonResponse } from "../utils/response";

/**
 * Mock OAuth2 Client Credentials token endpoint.
 *
 * Mirrors the WireMock stub: POST /oauth/token
 * Accepts any valid client_credentials grant and returns a static Bearer token.
 *
 * Supports X-Mock-Status header to force error scenarios:
 *   - "401" → invalid credentials
 *   - "400" → invalid grant type
 */
export const handleOAuthToken = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const mockStatus = event.headers?.["X-Mock-Status"] ?? event.headers?.["x-mock-status"];

  if (mockStatus === "401") {
    return jsonResponse(
      401,
      {
        error: "invalid_client",
        error_description: "Client authentication failed",
      },
      { "Cache-Control": "no-store", Pragma: "no-cache" },
    );
  }

  const body = event.body ?? "";
  const contentType = event.headers?.["Content-Type"] ?? event.headers?.["content-type"] ?? "";

  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return jsonResponse(400, {
      error: "invalid_request",
      error_description: "Content-Type must be application/x-www-form-urlencoded",
    });
  }

  const params = new URLSearchParams(body);
  const grantType = params.get("grant_type");
  const clientId = params.get("client_id");
  const clientSecret = params.get("client_secret");

  if (grantType !== "client_credentials") {
    return jsonResponse(
      400,
      {
        error: "unsupported_grant_type",
        error_description: `Grant type '${grantType ?? ""}' is not supported. Use 'client_credentials'.`,
      },
      { "Cache-Control": "no-store", Pragma: "no-cache" },
    );
  }

  if (!clientId || !clientSecret) {
    return jsonResponse(
      400,
      {
        error: "invalid_request",
        error_description: "Missing required parameters: client_id, client_secret",
      },
      { "Cache-Control": "no-store", Pragma: "no-cache" },
    );
  }

  return jsonResponse(
    200,
    {
      access_token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdXBwbGllcl9jbGllbnQiLCJzY29wZSI6Im9yZGVycyByZXN1bHRzIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.mock-signature",
      token_type: "Bearer",
      expires_in: 3600,
      scope: "orders results",
    },
    { "Cache-Control": "no-store", Pragma: "no-cache" },
  );
};
