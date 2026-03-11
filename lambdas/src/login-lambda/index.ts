import { type APIGatewayProxyEvent, type APIGatewayProxyResult } from "aws-lambda";
import { defaultCorsOptions } from "./cors-configuration";
import { init } from "./init";
import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import httpSecurityHeaders from "@middy/http-security-headers";
import { securityHeaders } from "../lib/http/security-headers";
import { retrieveMandatoryEnvVariable, retrieveOptionalEnvVariable } from "../lib/utils/utils";

// ALPHA: This file will need revisiting.
// These env vars are read at module load (cold start), not per-invocation,
// so a Lambda restart is required if they change.
const authCookieSameSite = retrieveMandatoryEnvVariable("AUTH_COOKIE_SAME_SITE");
// Lowercase comparison canonicalises any env var casing before boolean coercion.
const authCookieSecure =
  retrieveOptionalEnvVariable("AUTH_COOKIE_SECURE", "true").toLowerCase() === "true";

export interface LoginBody {
  code: string; // the auth code from NHS login
  // ALPHA: Removed temporarily until purpose can be determined.
  // source: UserSource;
  // urlSource?: string;
}

const className = "handler";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const { authTokenService, loginService } = await init();
  if (event.body === null) {
    return {
      statusCode: 400,
      body: "Invalid request, missing body",
    };
  }

  if (typeof event.body !== "string") {
    return {
      statusCode: 400,
      body: "Invalid request, body must be a string",
    };
  }

  const body = JSON.parse(event.body) as LoginBody;

  try {
    const loginOutput = await loginService.performLogin(body);

    // Non-null assertion is safe here: performLogin() always resolves with a
    // non-empty access_token or throws, so nhsLoginAccessToken is guaranteed.
    const signedAuthAccessJwt = authTokenService.generateAuthAccessToken({
      sessionId: loginOutput.nhsLoginAccessToken!,
      sessionStartTime: Date.now(),
    });

    const signedAuthRefreshJwt = authTokenService.generateAuthRefreshToken({
      refreshToken: loginOutput.nhsLoginRefreshToken || "",
    });

    const secureAttr = authCookieSecure ? " Secure;" : "";

    return {
      statusCode: 200,
      body: JSON.stringify(loginOutput.userInfoResponse),
      // API Gateway requires multiValueHeaders (not headers) to emit multiple
      // Set-Cookie entries; using headers would silently drop all but the last.
      multiValueHeaders: {
        "Set-Cookie": [
          // Access token is scoped to all paths so every API route can read it.
          `auth=${signedAuthAccessJwt}; HttpOnly; Path=/; SameSite=${authCookieSameSite};${secureAttr}`,
          // Refresh token is scoped to /refresh-token only to reduce its surface
          // exposure — other endpoints cannot read or forward it.
          `auth_refresh=${signedAuthRefreshJwt}; HttpOnly; Path=/refresh-token; SameSite=${authCookieSameSite};${secureAttr}`,
        ],
      },
    };
  } catch (e) {
    const err = e as { cause?: { details?: { responseData?: unknown } } } | undefined;
    // Only the upstream responseData is logged — not the raw error or request
    // body — to avoid leaking auth codes or tokens into CloudWatch logs.
    console.error(`${className} - Error in login handler:`, err?.cause?.details?.responseData);
    throw e;
  }
};

export const handler = middy(lambdaHandler)
  .use(httpSecurityHeaders(securityHeaders))
  .use(cors(defaultCorsOptions))
  .use(httpErrorHandler());
