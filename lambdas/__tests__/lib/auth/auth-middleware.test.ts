import { AuthTokenVerifier } from '../../../src/lib/auth/auth-token-verifier';
import { type APIGatewayProxyResult } from 'aws-lambda';
import {
  type APIGatewayProxyEventWithUserData,
  authMiddleware
} from '../../../src/lib/auth/auth-middleware';
import type middy from '@middy/core';
import createHttpError from 'http-errors';
import Sinon from 'ts-sinon';
import { SessionDbClient } from '../../../src/lib/db/db-clients/session-db-client';
import {
  UserSource,
  type ISession
} from '../../../src/lib/models/session/session';
import { Commons } from '../../../src/lib/commons';
import { Logger } from '@aws-lambda-powertools/logger';

jest.mock('../../../src/lib/utils', () => ({
  retrieveMandatoryEnvVariable: jest.fn().mockReturnValue('Strict')
}));

describe('authMiddleware tests', () => {
  const sandbox = Sinon.createSandbox();
  const mockSessionObject: ISession = {
    sessionId: '11-22-33',
    nhsNumber: '123123132',
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
    firstName: 'firstName',
    lastName: 'lastName',
    dateOfBirth: 'dateOfBirth',
    email: 'email',
    odsCode: 'gpOdsCode',
    ttl: 10000,
    source: UserSource.NHSApp,
    rumIdentityId: 'rumIdentityId'
  };
  const validJwtToken = 'jwtToken';
  const createRequestStub = (): middy.Request<
    APIGatewayProxyEventWithUserData,
    APIGatewayProxyResult
  > => {
    return {
      event: {
        headers: {
          cookie: `auth=${validJwtToken}`
        },
        requestContext: {
          authorizer: {}
        }
      }
    } as unknown as middy.Request<
      APIGatewayProxyEventWithUserData,
      APIGatewayProxyResult
    >;
  };

  let authTokenVerifierMock: Sinon.SinonStubbedInstance<AuthTokenVerifier>;
  let sessionDbClientMock: Sinon.SinonStubbedInstance<SessionDbClient>;
  let middlewareObj: middy.MiddlewareObj<any, any>;
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let logger: Sinon.SinonStubbedInstance<Logger>;

  beforeEach(() => {
    authTokenVerifierMock = sandbox.createStubInstance(AuthTokenVerifier);
    sessionDbClientMock = sandbox.createStubInstance(SessionDbClient);
    commonsStub = sandbox.createStubInstance(Commons);
    (commonsStub as any).logger = null;
    logger = sandbox.createStubInstance(Logger);
    Sinon.stub(commonsStub, 'logger').value(logger);
    middlewareObj = authMiddleware(
      commonsStub as unknown as Commons,
      authTokenVerifierMock,
      sessionDbClientMock
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  test.each([[''], ['auth='], [undefined], [null]])(
    'When cookie value is "%s", then `before` method should throw error with 401 http code',
    async (cookie: string | undefined | null) => {
      expect.assertions(3);
      try {
        const requestStub = {
          event: {
            headers: {
              cookie
            }
          }
        } as unknown as middy.Request<
          APIGatewayProxyEventWithUserData,
          APIGatewayProxyResult
        >;

        await middlewareObj.before?.(requestStub);
      } catch (e) {
        expect(e).toBeInstanceOf(createHttpError.HttpError);
        expect((e as createHttpError.HttpError).statusCode).toEqual(401);
        expect((e as createHttpError.HttpError).message).toEqual(
          JSON.stringify({ reason: 'no-auth-cookie' })
        );
      }
    }
  );

  test('When auth cookie is invalid token then throw 401 Unauthorized', async () => {
    expect.assertions(2);
    try {
      const requestStub = {
        event: {
          headers: {
            auth: 'invalidToken'
          }
        }
      } as unknown as middy.Request<
        APIGatewayProxyEventWithUserData,
        APIGatewayProxyResult
      >;

      await middlewareObj.before?.(requestStub);
    } catch (e) {
      expect(e).toBeInstanceOf(createHttpError.HttpError);
      expect((e as createHttpError.HttpError).statusCode).toEqual(401);
    }
  });

  test('When auth cookie is set and correct then no errors should bo thrown', async () => {
    const expectedJwt = {
      sessionId: mockSessionObject.sessionId
    };

    authTokenVerifierMock.verifyToken.resolves(expectedJwt);
    sessionDbClientMock.getSession.resolves(mockSessionObject);

    const requestStub = createRequestStub();
    await expect(middlewareObj.before?.(requestStub)).resolves.not.toThrow();
    expect(
      authTokenVerifierMock.verifyToken.calledOnceWithExactly(validJwtToken)
    ).toBeTruthy();
    expect(
      sessionDbClientMock.getSession.calledOnceWithExactly(
        mockSessionObject.sessionId
      )
    ).toBeTruthy();
    expect(requestStub.event.requestContext.authorizer).toEqual(expectedJwt);
    expect(requestStub.event.userData).toMatchObject({
      sessionId: mockSessionObject.sessionId,
      nhsNumber: mockSessionObject.nhsNumber,
      firstName: mockSessionObject.firstName,
      lastName: mockSessionObject.lastName,
      dateOfBirth: mockSessionObject.dateOfBirth,
      email: mockSessionObject.email,
      odsCode: mockSessionObject.odsCode,
      rumIdentityId: mockSessionObject.rumIdentityId
    });
    expect(
      logger.appendKeys.calledOnceWithExactly({
        metadata: {
          sessionId: mockSessionObject.sessionId,
          source: mockSessionObject.source
        }
      })
    ).toBeTruthy();
  });

  test('When verifying token fails then 401 error should be thrown', async () => {
    expect.assertions(2);
    try {
      const jwtToken = 'invalidToken';
      const error = new Error('invalid token');
      authTokenVerifierMock.verifyToken.rejects(error);
      const requestStub = {
        event: {
          headers: {
            cookie: `auth=${jwtToken}`
          },
          requestContext: {
            authorizer: {}
          }
        }
      } as unknown as middy.Request<
        APIGatewayProxyEventWithUserData,
        APIGatewayProxyResult
      >;
      await middlewareObj.before?.(requestStub);
    } catch (e) {
      expect(e).toBeInstanceOf(createHttpError.HttpError);
      expect((e as createHttpError.HttpError).statusCode).toEqual(401);
    }
  });

  test('When no session returned an error should be thrown', async () => {
    const expectedJwt = {
      sessionId: mockSessionObject.sessionId
    };

    authTokenVerifierMock.verifyToken.resolves(expectedJwt);
    sessionDbClientMock.getSession.resolves(undefined);

    const requestStub = createRequestStub();
    await expect(middlewareObj.before?.(requestStub)).rejects.toThrow(
      createHttpError(500)
    );
    expect(
      authTokenVerifierMock.verifyToken.calledOnceWithExactly(validJwtToken)
    ).toBeTruthy();
    expect(
      sessionDbClientMock.getSession.calledOnceWithExactly(
        mockSessionObject.sessionId
      )
    ).toBeTruthy();
  });

  test('When error thrown while fetching session an error should be thrown', async () => {
    const expectedJwt = {
      sessionId: mockSessionObject.sessionId
    };

    authTokenVerifierMock.verifyToken.resolves(expectedJwt);
    sessionDbClientMock.getSession.throws(new Error('Temporarily unavailable'));

    const requestStub = createRequestStub();
    await expect(middlewareObj.before?.(requestStub)).rejects.toThrow(
      createHttpError(500)
    );
    expect(
      authTokenVerifierMock.verifyToken.calledOnceWithExactly(validJwtToken)
    ).toBeTruthy();
    expect(
      sessionDbClientMock.getSession.calledOnceWithExactly(
        mockSessionObject.sessionId
      )
    ).toBeTruthy();
  });
});
