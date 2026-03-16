import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { handleOAuthToken } from "./handlers/oauth-token";
import { handleOrder } from "./handlers/order";
import { handleResults } from "./handlers/results";
import { handleJwks } from "./handlers/jwks";
import { handlePostcode } from "./handlers/postcode";
import { handleHealth } from "./handlers/health";
import { jsonResponse } from "./utils/response";

interface Route {
  /** HTTP method (GET, POST, ANY) */
  method: string;
  /** Regex matched against event.path */
  pattern: RegExp;
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
}

const routes: Route[] = [
  // Health
  { method: "GET", pattern: /^\/mock\/health$/, handler: handleHealth },

  // Cognito JWKS
  { method: "GET", pattern: /^\/mock\/cognito\/.well-known\/jwks(\.json)?$/, handler: handleJwks },

  // Supplier OAuth2
  { method: "POST", pattern: /^\/mock\/supplier\/(oauth\/token|api\/oauth)$/, handler: handleOAuthToken },

  // Supplier Order
  { method: "POST", pattern: /^\/mock\/supplier\/order$/, handler: handleOrder },
  { method: "GET", pattern: /^\/mock\/supplier\/order$/, handler: handleOrder },

  // Supplier Results
  { method: "GET", pattern: /^\/mock\/supplier\/(results|api\/results|nhs_home_test\/results)$/, handler: handleResults },

  // Postcode lookup
  { method: "GET", pattern: /^\/mock\/postcode\/([A-Za-z0-9 ]+)$/, handler: handlePostcode },
];

export const route = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, path } = event;

  for (const r of routes) {
    if ((r.method === "ANY" || r.method === httpMethod) && r.pattern.test(path)) {
      return r.handler(event);
    }
  }

  return jsonResponse(404, {
    error: "Not Found",
    message: `No mock registered for ${httpMethod} ${path}`,
    availableRoutes: routes.map((r) => `${r.method} ${r.pattern.source}`),
  });
};
