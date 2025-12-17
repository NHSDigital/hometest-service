import {
  AuthTokenService,
  type IAuthTokenService
} from '../../../src/lib/auth/auth-token-service';
import { type IAuthConfig } from '../../../src/lib/models/auth/auth-config';
import { Commons } from '../../../src/lib/commons';
import {
  type AuthAccessTokenConfig,
  type AuthRefreshTokenConfig
} from '../../../src/lib/models/auth/auth-token-config';
import jwt, { type SignOptions } from 'jsonwebtoken';

jest.useFakeTimers().setSystemTime(Date.now());

describe('AuthTokenService', () => {
  const authConfig: IAuthConfig = {
    sessionMaxDurationMinutes: 5,
    accessTokenExpiryDurationMinutes: 3,
    refreshTokenExpiryDurationMinutes: 10,
    publicKeys: {
      'dev-1': `publicKey`
    },
    privateKeys: {
      'dev-1': `privateKey`
    },
    keyId: 'dev-1'
  };
  const authAccessTokenConfig: AuthAccessTokenConfig = {
    sessionId: 'abcd123',
    sessionStartTime: 1747858428863
  };
  const authRefreshTokenConfig: AuthRefreshTokenConfig = {
    refreshToken: 'refresh123'
  };
  const jwtOptions: SignOptions = {
    algorithm: 'RS512',
    header: {
      alg: 'RS512',
      kid: authConfig.keyId
    }
  };
  const expectedAuthToken: string = 'token';
  const expectedDecodedToken = {
    sub: '1234567890',
    name: 'John Doe',
    iat: 1516239022,
    header: {
      alg: 'RS512',
      kid: 'dev-1'
    }
  };
  const encodedToken: string = 'validToken';
  const errorMsg = 'invalid!';

  let authTokenService: IAuthTokenService;

  const signSpy = jest.spyOn(jwt, 'sign');
  const verifySpy = jest.spyOn(jwt, 'verify');
  let commonsSpy: Commons;

  beforeEach(() => {
    commonsSpy = new Commons('test', 'test');
    jest.spyOn(commonsSpy, 'logInfo');
    authTokenService = new AuthTokenService(commonsSpy, authConfig);

    signSpy.mockImplementation(() => expectedAuthToken);
    verifySpy.mockImplementation(async (token: string) => {
      if (token === encodedToken) {
        return await Promise.resolve(expectedDecodedToken);
      } else {
        return await Promise.reject(errorMsg);
      }
    });
  });

  afterEach(() => {
    signSpy.mockReset();
    verifySpy.mockReset();
  });

  test('generateAuthToken method should return auth token', () => {
    const authToken = authTokenService.generateAuthAccessToken(
      authAccessTokenConfig
    );

    expect(authToken).toEqual(expectedAuthToken);
    expect(signSpy).toHaveBeenCalledWith(
      authAccessTokenConfig,
      authConfig.privateKeys[authConfig.keyId],
      {
        ...jwtOptions,
        expiresIn: authConfig.accessTokenExpiryDurationMinutes + 'm'
      }
    );
  });
  test('generateAuthToken method should return auth token', () => {
    const authToken = authTokenService.generateAuthRefreshToken(
      authRefreshTokenConfig
    );

    expect(authToken).toEqual(expectedAuthToken);
    expect(signSpy).toHaveBeenCalledWith(
      authRefreshTokenConfig,
      authConfig.privateKeys[authConfig.keyId],
      {
        ...jwtOptions,
        expiresIn: authConfig.refreshTokenExpiryDurationMinutes + 'm'
      }
    );
  });
  test('generateAuthToken method should return auth token and log info', () => {
    const authToken = authTokenService.generateAuthRefreshToken(
      authRefreshTokenConfig
    );

    expect(authToken).toEqual(expectedAuthToken);
    expect(signSpy).toHaveBeenCalledWith(
      authRefreshTokenConfig,
      authConfig.privateKeys[authConfig.keyId],
      {
        ...jwtOptions,
        expiresIn: authConfig.refreshTokenExpiryDurationMinutes + 'm'
      }
    );
    expect(commonsSpy.logInfo).toHaveBeenCalledWith(
      'AuthTokenService',
      'about to sign jwt token',
      {}
    );
  });
});
