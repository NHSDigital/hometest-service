import Sinon from 'ts-sinon';
import { Commons } from '../../../src/lib/commons';
import { type INhsLoginConfig } from '../../../src/lib/models/nhs-login/nhs-login-config';
import { NhsLoginJwtHelper } from '../../../src/lib/login/nhs-login-jwt-helper';
import { HttpClient } from '../../../src/lib/http/http-client';
import { NhsLoginClient } from '../../../src/lib/login/nhs-login-client';
import { URLSearchParams } from 'url';
import { JwksClient, type RsaSigningKey } from 'jwks-rsa';

describe('nhsLoginClient tests', () => {
  const sandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let nhsLoginConfig: INhsLoginConfig;
  let nhsLoginJwtHelperStub: Sinon.SinonStubbedInstance<NhsLoginJwtHelper>;
  let httpClientStub: Sinon.SinonStubbedInstance<HttpClient>;
  let jwksClientStub: Sinon.SinonStubbedInstance<JwksClient>;
  let nhsLoginClient: NhsLoginClient;
  let formData: URLSearchParams;
  const serviceClassName = 'NhsLoginClient';

  const testSignedToken = 'abc';
  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    nhsLoginConfig = {
      clientId: 'client123',
      expiresIn: 12345,
      redirectUri: 'redirectUrl',
      baseUri: 'baseUri',
      privateKey: 'privateKey'
    };
    nhsLoginJwtHelperStub = sandbox.createStubInstance(NhsLoginJwtHelper);
    nhsLoginJwtHelperStub.createClientAuthJwt.returns(testSignedToken);

    httpClientStub = sandbox.createStubInstance(HttpClient);
    jwksClientStub = sandbox.createStubInstance(JwksClient);
    nhsLoginClient = new NhsLoginClient(
      commonsStub as unknown as Commons,
      nhsLoginConfig,
      nhsLoginJwtHelperStub,
      httpClientStub as unknown as HttpClient,
      jwksClientStub as unknown as JwksClient
    );

    formData = new URLSearchParams({
      code: '12345',
      client_id: nhsLoginConfig.clientId,
      redirect_uri: nhsLoginConfig.redirectUri,
      grant_type: 'authorization_code',
      client_assertion_type:
        'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: testSignedToken
    });
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('getUserTokens method tests', () => {
    const code = '12345';
    test('successful post request and log out success', async () => {
      const expectedResult = {};

      const postRequest = {
        endpointUrl: `${nhsLoginConfig.baseUri}/token`,
        body: formData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      };

      httpClientStub.postRequest.resolves(expectedResult);
      const result = await nhsLoginClient.getUserTokens(code);
      sandbox.assert.calledOnceWithExactly(
        httpClientStub.postRequest,
        postRequest.endpointUrl,
        postRequest.body,
        postRequest.headers
      );

      expect(nhsLoginJwtHelperStub.createClientAuthJwt.calledOnce).toBeTruthy();

      expect(result).toMatchObject(expectedResult);
    });

    test('thrown error for unsuccessful request, logged out failure', async () => {
      const exception = new Error(
        'could not get user tokens based on authentication code'
      );
      httpClientStub.postRequest.throwsException(exception);

      await expect(nhsLoginClient.getUserTokens('12345')).rejects.toThrow(
        exception
      );

      sandbox.assert.calledOnceWithExactly(
        httpClientStub.postRequest,
        `${nhsLoginConfig.baseUri}/token`,
        formData,
        {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      );

      sandbox.assert.calledWith(
        commonsStub.logError,
        serviceClassName,
        'could not get user tokens based on authentication code'
      );
    });
  });

  describe('getUserInfo method tests', () => {
    test('successful get request and log out success', async () => {
      const expectedResult = {};
      httpClientStub.getRequest.resolves(expectedResult);

      const result = await nhsLoginClient.getUserInfo('12345');

      const getRequest = {
        endpointUrl: `${nhsLoginConfig.baseUri}/userinfo`,
        headers: { Authorization: 'Bearer 12345' }
      };

      sandbox.assert.calledOnceWithExactly(
        httpClientStub.getRequest,
        getRequest.endpointUrl,
        getRequest.headers
      );
      expect(result).toMatchObject(expectedResult);
    });

    test('throws error for failed get, logged error', async () => {
      const exception = new Error(
        'could not get user tokens based on authentication code'
      );
      httpClientStub.getRequest.throwsException(exception);

      await expect(nhsLoginClient.getUserInfo('12345')).rejects.toThrow(
        exception
      );
      expect(httpClientStub.getRequest.calledOnce).toBeTruthy();
      sandbox.assert.calledWith(
        commonsStub.logError,
        serviceClassName,
        'could not get user tokens based on authentication code'
      );
    });
  });

  describe('fetchPublicKeyById method tests', () => {
    test('successful get request for key, log out success', async () => {
      const kid = '12345';
      const publicKey = '4321';
      const signingKeyResponse: RsaSigningKey = {
        kid: 'kid',
        alg: 'alg',
        getPublicKey: sandbox.stub(),
        rsaPublicKey: 'pubKey'
      };

      (signingKeyResponse.getPublicKey as Sinon.SinonStub).returns(publicKey);
      jwksClientStub.getSigningKey.resolves(signingKeyResponse);
      const result = await nhsLoginClient.fetchPublicKeyById(kid);

      expect(
        (signingKeyResponse.getPublicKey as Sinon.SinonStub).calledOnce
      ).toBeTruthy();
      expect(result).toEqual(publicKey);

      sandbox.assert.calledWith(
        commonsStub.logInfo,
        serviceClassName,
        'public key fetched'
      );
    });

    test('throws error and logs failure', async () => {
      const signingKeyResponse: RsaSigningKey = {
        kid: 'kid',
        alg: 'alg',
        getPublicKey: sandbox.stub(),
        rsaPublicKey: 'pubKey'
      };
      const exception = new Error(
        'could not fetch NHS login public key by kid'
      );

      jwksClientStub.getSigningKey.throwsException(exception);
      await expect(nhsLoginClient.fetchPublicKeyById('12345')).rejects.toThrow(
        exception
      );
      expect(jwksClientStub.getSigningKey.calledOnce).toBeTruthy();
      sandbox.assert.notCalled(
        // eslint-disable-next-line @typescript-eslint/unbound-method
        signingKeyResponse.getPublicKey as Sinon.SinonStub
      );
      sandbox.assert.calledWith(
        commonsStub.logError,
        serviceClassName,
        'could not fetch NHS login public key by kid'
      );
    });
  });
});
