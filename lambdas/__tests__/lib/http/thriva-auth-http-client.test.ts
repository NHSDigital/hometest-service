import Sinon from 'ts-sinon';
import { Commons } from '../../../src/lib/commons';
import { HttpClient } from '../../../src/lib/http/http-client';
import { LogMethodNames, TestUtil } from '../../util/test-util';
import { ThrivaAuthHttpClient } from '../../../src/lib/http/thriva-auth-http-client';

describe('ThrivaAuthHttpClient', () => {
  const apiEndpoint = 'mockEndpoint';
  const authApiEndpoint = 'mockAuthEndpoint';
  const audienceEndpoint = 'mockAudienceEndpoint';
  const secretKey = 'mockSecretKey';
  const clientId = 'mockClientId';
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();

  let service: ThrivaAuthHttpClient;
  let testUtil: TestUtil;
  let commons: Sinon.SinonStubbedInstance<Commons>;
  let httpClient: Sinon.SinonStubbedInstance<HttpClient>;
  const authResponse = {
    access_token: 'MOCK_TOKEN',
    scope: 'scopes',
    expires_in: 10800,
    token_type: 'Bearer'
  };

  beforeEach(() => {
    commons = sandbox.createStubInstance(Commons);
    httpClient = sandbox.createStubInstance(HttpClient);

    service = new ThrivaAuthHttpClient(
      commons as unknown as Commons,
      httpClient as unknown as HttpClient,
      authApiEndpoint,
      apiEndpoint,
      audienceEndpoint,
      secretKey,
      clientId
    );
    testUtil = new TestUtil(commons, service.className);
  });

  afterEach(() => {
    sandbox.restore();
    jest.resetAllMocks();
  });

  describe('auth method', () => {
    it('Authenticates with Thriva', async () => {
      httpClient.postRequest.resolves(authResponse);
      const response = await service.auth();

      sandbox.assert.calledOnceWithExactly(
        httpClient.postRequest,
        authApiEndpoint + '/oauth/token',
        {
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: secretKey,
          audience: audienceEndpoint
        }
      );
      expect(response).toContain(authResponse.access_token);
    });

    it('Throws and logs an error when error occurs', async () => {
      const err = new Error('Mock error');
      httpClient.postRequest.throwsException(err);

      await expect(service.auth()).rejects.toThrow(err);

      testUtil.expectLogProduced(
        'The call to Thriva auth API ended with an error',
        {
          error: err
        },
        LogMethodNames.ERROR
      );
    });
  });
});
