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
const authCookieSameSite = retrieveMandatoryEnvVariable("AUTH_COOKIE_SAME_SITE");
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

  const body = JSON.parse(event.body) as LoginBody;

  try {
    const loginOutput = await loginService.performLogin(body);

    const signedAuthAccessJwt = authTokenService.generateAuthAccessToken({
      sessionId: loginOutput.nhsLoginAccessToken,
      sessionStartTime: Date.now(),
    });

    const signedAuthRefreshJwt = authTokenService.generateAuthRefreshToken({
      refreshToken: loginOutput.nhsLoginRefreshToken || "",
    });

    const secureAttr = authCookieSecure ? " Secure;" : "";

    return {
      statusCode: 200,
      body: JSON.stringify(loginOutput.userInfoResponse),
      multiValueHeaders: {
        "Set-Cookie": [
          `auth=${signedAuthAccessJwt}; HttpOnly; Path=/; SameSite=${authCookieSameSite};${secureAttr}`,
          `auth_refresh=${signedAuthRefreshJwt}; HttpOnly; Path=/refresh-token; SameSite=${authCookieSameSite};${secureAttr}`,
        ],
      },
    };
  } catch (e) {
    const err = e as { cause?: { details?: { responseData?: unknown } } } | undefined;
    console.error(`${className} - Error in login handler:`, err?.cause?.details?.responseData);
    throw e;
  }
};

export const handler = middy(lambdaHandler)
  .use(httpSecurityHeaders(securityHeaders))
  .use(cors(defaultCorsOptions))
  .use(httpErrorHandler());
