import { randomUUID } from "node:crypto";

import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import httpSecurityHeaders from "@middy/http-security-headers";
import { type APIGatewayProxyEvent, type APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";

import { securityHeaders } from "../lib/http/security-headers";
import { createJsonResponse, getCorrelationIdFromEventHeaders } from "../lib/utils/utils";
import { generateReadableError } from "../lib/utils/validation-utils";
import { corsOptions } from "./cors-configuration";
import { init } from "./init";

export const LoginBodySchema = z.object({
  code: z.string().min(1, "code is required"),
});

export type LoginBody = z.infer<typeof LoginBodySchema>;

const name = "login-lambda";

const resolveCorrelationId = (event: APIGatewayProxyEvent): string => {
  try {
    return getCorrelationIdFromEventHeaders(event);
  } catch (error) {
    const correlationId = randomUUID();
    const reason = error instanceof Error ? error.message : "Unknown correlation ID error";
    console.info(name, "Generated fallback correlation ID", { correlationId, reason });
    return correlationId;
  }
};

const parseLoginBody = (body: string | null): LoginBody => {
  if (body === null) {
    throw new Error("Body is required");
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(body);
  } catch (error) {
    throw new Error("Invalid JSON in request body", { cause: error });
  }

  const validationResult = LoginBodySchema.safeParse(parsedBody);
  if (!validationResult.success) {
    const errorDetails = generateReadableError(validationResult.error);
    throw new Error(`Validation failed: ${errorDetails}`);
  }

  return validationResult.data;
};

export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const correlationId = resolveCorrelationId(event);
  let body: LoginBody;

  try {
    body = parseLoginBody(event.body);
  } catch (error) {
    return createJsonResponse(400, {
      message: error instanceof Error ? error.message : "Invalid request body",
    });
  }

  const { authTokenService, loginService, authCookieSameSite, authCookieSecure } = await init();

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
    const response = createJsonResponse(200, { ...loginOutput.userInfoResponse });

    return {
      ...response,
      multiValueHeaders: {
        "Set-Cookie": [
          `auth=${signedAuthAccessJwt}; HttpOnly; Path=/; SameSite=${authCookieSameSite};${secureAttr}`,
          `auth_refresh=${signedAuthRefreshJwt}; HttpOnly; Path=/refresh-token; SameSite=${authCookieSameSite};${secureAttr}`,
        ],
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown login error";
    console.error(name, "Error in login handler", { correlationId, message });
    return createJsonResponse(500, { message: "Internal server error" });
  }
};

export const handler = middy(lambdaHandler)
  .use(httpSecurityHeaders(securityHeaders))
  .use(cors(corsOptions))
  .use(httpErrorHandler());
