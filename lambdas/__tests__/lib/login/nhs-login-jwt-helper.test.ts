import { Commons } from '../../../src/lib/commons';
import jwt from 'jsonwebtoken';
import { type INhsLoginConfig } from '../../../src/lib/models/nhs-login/nhs-login-config';
import {
  type INhsLoginJwtHelper,
  NhsLoginJwtHelper
} from '../../../src/lib/login/nhs-login-jwt-helper';

const uuid = '123456789';
jest.mock('uuid', () => ({ v4: () => uuid }));

describe('NhsLoginJwtHelper', () => {
  const nhsLoginConfig: INhsLoginConfig = {
    clientId: 'clientId',
    expiresIn: 10,
    redirectUri: 'some/path/redirect',
    baseUri: 'someUri.uk',
    privateKey: 'someKey'
  };
  const expectedOptions: jwt.SignOptions = {
    algorithm: 'RS512',
    subject: nhsLoginConfig.clientId,
    issuer: nhsLoginConfig.clientId,
    audience: `${nhsLoginConfig.baseUri}/token`,
    jwtid: uuid,
    expiresIn: nhsLoginConfig.expiresIn
  };
  const expectedSignedToken: string = 'token';
  const errorMsg = 'invalid!';

  const nhsLoginJwtHelper: INhsLoginJwtHelper = new NhsLoginJwtHelper(
    new Commons('test', 'test'),
    nhsLoginConfig
  );

  const signSpy = jest.spyOn(jwt, 'sign');

  afterEach(() => {
    signSpy.mockReset();
  });

  describe('createClientAuthJwt method', () => {
    test('should return signed token', () => {
      signSpy.mockImplementation(() => expectedSignedToken);

      const signedToken = nhsLoginJwtHelper.createClientAuthJwt();

      expect(signedToken).toEqual(expectedSignedToken);
      expect(signSpy).toHaveBeenCalledWith(
        {},
        nhsLoginConfig.privateKey,
        expectedOptions
      );
    });

    test('should throw error when jwt throws one', () => {
      signSpy.mockImplementation(() => {
        throw new Error(errorMsg);
      });

      expect.assertions(2);
      try {
        nhsLoginJwtHelper.createClientAuthJwt();
      } catch (e: any) {
        expect(e.message).toEqual(errorMsg);
      }

      expect(signSpy).toHaveBeenCalledWith(
        {},
        nhsLoginConfig.privateKey,
        expectedOptions
      );
    });
  });
});
