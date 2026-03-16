import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import { route } from "./router";

/**
 * Mock Service Lambda — routes incoming API Gateway requests to the appropriate
 * stub handler based on path prefix:
 *
 *   /mock/supplier/oauth/token      → OAuth2 token endpoint
 *   /mock/supplier/order            → Order placement / status
 *   /mock/supplier/results          → Test results lookup
 *   /mock/cognito/.well-known/jwks  → JWKS public key set
 *   /mock/postcode/{postcode}       → Postcode → local authority lookup
 *   /mock/health                    → Health check
 */
const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("mock-service", {
    method: event.httpMethod,
    path: event.path,
    queryStringParameters: event.queryStringParameters,
  });

  return route(event);
};

export const handler = middy()
  .use(cors({ origins: ["*"] }))
  .use(httpErrorHandler())
  .handler(lambdaHandler);
