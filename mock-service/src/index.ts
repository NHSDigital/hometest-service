import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import { loadMappings, matchRequest } from "./stub-matcher";
import { renderTemplate } from "./template-engine";

/**
 * Generic WireMock-compatible stub runner for AWS Lambda.
 *
 * Loads WireMock JSON mapping files from the bundled `mappings/` directory
 * and matches incoming API Gateway requests against them using the same
 * matching rules as WireMock (method, urlPath, urlPathPattern, headers,
 * queryParameters, bodyPatterns, priority).
 *
 * The JSON stub files are the single source of truth — no per-endpoint
 * TypeScript code needed. To add a new mock, just drop a JSON file into
 * local-environment/wiremock/mappings/.
 */

const mappings = loadMappings();

const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  // Strip the API Gateway stage prefix and /mock/supplier or /mock/cognito prefix
  // so the path matches what WireMock sees:
  //   /mock/supplier/oauth/token → /oauth/token
  //   /mock/supplier/order       → /order
  //   /mock/cognito/.well-known/jwks.json → /.well-known/jwks.json
  //   /mock/postcode/SW1A1AA     → /postcode/SW1A1AA
  const rawPath = event.pathParameters?.proxy
    ? `/${event.pathParameters.proxy}`
    : event.path;

  const path =
    rawPath
      .replace(/^\/mock\/supplier/, "")
      .replace(/^\/mock\/cognito/, "")
      .replace(/^\/mock/, "") || "/";

  console.log("mock-service", {
    method: event.httpMethod,
    originalPath: event.path,
    matchPath: path,
  });

  const match = matchRequest(mappings, {
    method: event.httpMethod,
    path,
    headers: event.headers ?? {},
    queryParameters: event.queryStringParameters ?? {},
    body: event.body ?? "",
  });

  if (!match) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "No matching stub",
        message: `No WireMock mapping matched ${event.httpMethod} ${path}`,
        availableMappings: mappings.map((m) => ({
          priority: m.priority,
          method: m.request.method,
          urlPath: m.request.urlPath,
          urlPathPattern: m.request.urlPathPattern,
        })),
      }),
    };
  }

  const response = match.response;
  const headers: Record<string, string> = { ...response.headers };

  let body: string;
  if (response.jsonBody !== undefined) {
    body = JSON.stringify(response.jsonBody);
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
  } else {
    body = response.body ?? "";
  }

  // Apply WireMock response templating ({{randomValue}}, {{now}}, etc.)
  body = renderTemplate(body);

  return {
    statusCode: response.status ?? 200,
    headers,
    body,
  };
};

export const handler = middy()
  .use(httpErrorHandler())
  .handler(lambdaHandler);
