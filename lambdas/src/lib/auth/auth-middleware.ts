import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult,
  type APIGatewayEventDefaultAuthorizerContext
} from 'aws-lambda';
import type middy from '@middy/core';
import createHttpError from 'http-errors';
import type { IAuthTokenVerifier } from './auth-token-verifier';
import { type UserSource, type ISession } from '../models/session/session';
import { type SessionDbClient } from '../db/db-clients/session-db-client';
import { type Commons } from '../commons';
import { getAuthCookieFromRequest } from './auth-utils';

export interface IUserData {
  sessionId: string;
  accessToken: string;
  firstName: string;
  lastName: string;
  email: string;
  nhsNumber: string;
  dateOfBirth: string;
  odsCode: string;
  source: UserSource;
  rumIdentityId: string;
  urlSource?: string;
}

export interface APIGatewayProxyEventWithUserData extends APIGatewayProxyEvent {
  userData: IUserData;
}

const className = 'authMiddleware';

const authMiddleware = (
  commons: Commons,
  authTokenVerifier: IAuthTokenVerifier,
  sessionDbClient: SessionDbClient
): middy.MiddlewareObj<any, any> => {
  const before: middy.MiddlewareFn<
    APIGatewayProxyEventWithUserData,
    APIGatewayProxyResult
  > = async (request): Promise<void> => {
    let authToken: APIGatewayEventDefaultAuthorizerContext;
    const headers = request?.event.headers;
    const cookie = headers.Cookie ?? headers.cookie;
    const authCookie = getAuthCookieFromRequest(cookie);

    if (authCookie === '') {
      throw new createHttpError.Unauthorized(
        JSON.stringify({
          reason: 'no-auth-cookie'
        })
      );
    }

    try {
      authToken = await authTokenVerifier.verifyToken(authCookie);

      request.event.requestContext.authorizer = {
        ...authToken
      };
    } catch (e) {
      commons.logError(
        className,
        'Encountered error while authorising',
        { e },
        true
      );
      throw createHttpError(401);
    }

    try {
      const userSession: ISession | undefined =
        await sessionDbClient.getSession(authToken.sessionId as string);

      if (!userSession) {
        commons.logError(
          className,
          'Error while fetching session object from DB',
          {
            sessionId: authToken.sessionId
          },
          true
        );
        throw new Error(
          `Cannot find session DB record for sessionId: ${authToken.sessionId}`
        );
      }
      request.event.userData = {
        sessionId: userSession.sessionId,
        accessToken: userSession.accessToken,
        nhsNumber: userSession.nhsNumber,
        dateOfBirth: userSession.dateOfBirth,
        firstName: userSession.firstName,
        lastName: userSession.lastName,
        email: userSession.email,
        odsCode: userSession.odsCode,
        source: userSession.source,
        rumIdentityId: userSession.rumIdentityId,
        urlSource: userSession.urlSource
      };

      commons.logger.appendKeys({
        metadata: {
          sessionId: userSession.sessionId,
          source: userSession.source
        }
      });
    } catch (e) {
      commons.logError(
        className,
        'Encountered error while fetching session',
        {
          e
        },
        true
      );
      throw createHttpError(500);
    }
  };

  return {
    before
  };
};

export { authMiddleware };
