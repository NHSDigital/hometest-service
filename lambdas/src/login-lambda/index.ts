import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult
} from 'aws-lambda';
import { defaultCorsOptions } from './cors-configuration';
import { init } from './init';
import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import httpSecurityHeaders from '@middy/http-security-headers';
import { securityHeaders } from '../lib/http/security-headers';
import { retrieveMandatoryEnvVariable } from '../lib/utils';

// ALPHA: This file will need revisiting.
const authCookieSameSite = retrieveMandatoryEnvVariable(
  'AUTH_COOKIE_SAME_SITE'
);

export interface LoginBody {
  code: string; // the auth code from NHS login
  // ALPHA: Removed temporarily until purpose can be determined.
  // source: UserSource;
  // urlSource?: string;
}

const className = 'handler';

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { authTokenService, loginService } = await init();
  if (event.body === null) {
    return {
      statusCode: 400,
      body: 'Invalid request, missing body'
    };
  }

  const body = JSON.parse(event.body) as LoginBody;

  try {
    const loginOutput = await loginService.performLogin(body);

    const signedAuthAccessJwt = authTokenService.generateAuthAccessToken({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      sessionId: loginOutput.nhsLoginAccessToken!,
      sessionStartTime: Date.now()
    });

    const signedAuthRefreshJwt = authTokenService.generateAuthRefreshToken({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      refreshToken: loginOutput.nhsLoginRefreshToken || '',
    });

    return {
      statusCode: 200,
      body: JSON.stringify(loginOutput.userInfoResponse),
      multiValueHeaders: {
        'Set-Cookie': [
          `auth=${signedAuthAccessJwt}; HttpOnly; Path=/; SameSite=${authCookieSameSite}; Secure;`,
          `auth_refresh=${signedAuthRefreshJwt}; HttpOnly; Path=/refresh-token; SameSite=${authCookieSameSite}; Secure;`
        ]
      }
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
