import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult,
} from "aws-lambda";
import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import httpSecurityHeaders from "@middy/http-security-headers";

import { securityHeaders } from "../lib/http/security-headers";
import { corsOptions } from "./cors-configuration";
import { getAuthCookieFromRequest } from "../lib/auth/auth-utils";
import { init } from "./init";
import { INhsUserInfoResponseModel } from "src/lib/models/nhs-login/nhs-login-user-info-response-model";

const className = "session-handler";

const unauthenticated = {
  statusCode: 401,
  body: "",
};

function authenticated(userInfo: INhsUserInfoResponseModel) {
  return {
    statusCode: 200,
    body: JSON.stringify(userInfo),
  };
}

export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const cookieHeader =
    event.headers?.cookie ?? event.headers?.Cookie ?? undefined;

  const authCookie = getAuthCookieFromRequest(cookieHeader);
  if (!authCookie) {
    return unauthenticated;
  }

  const { authTokenVerifier, nhsLoginClient } = await init();

  try {
    const payload = await authTokenVerifier.verifyToken(authCookie);

    const userInfoResponse = await nhsLoginClient.getUserInfo(
      payload.sessionId,
    );

    return authenticated(userInfoResponse);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    const errorStack = e instanceof Error ? e.stack : undefined;
    const errorCause = e instanceof Error ? (e as Error & { cause?: unknown }).cause : undefined;

    console.error(`${className} - Authentication failed:`, {
      message: errorMessage,
      stack: errorStack,
      cause: errorCause ? JSON.stringify(errorCause, null, 2) : undefined,
    });

    return unauthenticated;
  }
};

export const handler = middy(lambdaHandler)
  .use(httpSecurityHeaders(securityHeaders))
  .use(cors(corsOptions))
  .use(httpErrorHandler());
