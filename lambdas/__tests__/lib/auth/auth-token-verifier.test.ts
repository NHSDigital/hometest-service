import {
  AuthTokenVerifier,
  type IAuthTokenVerifier,
  type AuthTokenVerifierConfig
} from '../../../src/lib/auth/auth-token-verifier';
import { Commons } from '../../../src/lib/commons';
import jwt, { type SignOptions, type JwtPayload } from 'jsonwebtoken';

jest.useFakeTimers().setSystemTime(Date.now());

describe('AuthTokenVerifier', () => {
  const authConfig: AuthTokenVerifierConfig = {
    publicKeys: {
      'dev-1': `publicKey`
    },
    keyId: 'dev-1'
  };
  const jwtOptions: SignOptions = {
    algorithm: 'RS512',
    header: {
      alg: 'RS512',
      kid: authConfig.keyId
    }
  };
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
  const encodedInvalidToken: string = 'invalidToken';
  const errorMsg = 'invalid!';

  const authTokenVerifier: IAuthTokenVerifier = new AuthTokenVerifier(
    new Commons('test', 'test'),
    authConfig
  );

  const verifySpy = jest.spyOn(jwt, 'verify');

  beforeEach(() => {
    verifySpy.mockImplementation(async (token: string) => {
      if (token === encodedToken) {
        return await Promise.resolve(expectedDecodedToken);
      } else {
        return await Promise.reject(errorMsg);
      }
    });
  });

  afterEach(() => {
    verifySpy.mockReset();
  });

  describe('verifyToken method', () => {
    test('should return verified token', async () => {
      const verifiedToken = await authTokenVerifier.verifyToken(encodedToken);

      expect(verifiedToken).toEqual(expectedDecodedToken as JwtPayload);
      expect(verifySpy).toHaveBeenCalledWith(
        encodedToken,
        authConfig.publicKeys[authConfig.keyId],
        {
          algorithms: [jwtOptions.algorithm]
        }
      );
    });

    test('should throw error when jwt throws one', async () => {
      expect.assertions(2);
      try {
        await authTokenVerifier.verifyToken(encodedInvalidToken);
      } catch (e) {
        expect(e).toEqual(errorMsg);
      }

      expect(verifySpy).toHaveBeenCalledWith(
        encodedInvalidToken,
        authConfig.publicKeys[authConfig.keyId],
        {
          algorithms: [jwtOptions.algorithm]
        }
      );
    });
  });
});
