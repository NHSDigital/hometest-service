import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult,
} from "aws-lambda";
import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import httpSecurityHeaders from "@middy/http-security-headers";

import { securityHeaders } from "../lib/http/security-headers";
import { defaultCorsOptions } from "../login-lambda/cors-configuration";
import { getAuthCookieFromRequest } from "../lib/auth/auth-utils";
import { init } from "./init";

const className = "session-handler";

const unauthenticated = {
  statusCode: 401,
  body: JSON.stringify({ authenticated: false }),
};

function authenticated({
  sessionId,
  sessionStartTime,
}: {
  sessionId: string;
  sessionStartTime: number;
}) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      authenticated: true,
      session: {
        sessionId: sessionId,
        sessionStartTime: sessionStartTime,
      },
    }),
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

  const { authTokenVerifier } = await init();

  try {
    const payload = await authTokenVerifier.verifyToken(authCookie);

    return authenticated({
      sessionId: payload.sessionId,
      sessionStartTime: payload.sessionStartTime,
    });
  } catch (e) {
    console.warn(`${className} - Invalid auth cookie`);
    return unauthenticated;
  }
};

export const handler = middy(lambdaHandler)
  .use(httpSecurityHeaders(securityHeaders))
  .use(cors(defaultCorsOptions))
  .use(httpErrorHandler());
