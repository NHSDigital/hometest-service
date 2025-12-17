import Sinon from 'ts-sinon';
import { generateKeyPair } from 'crypto';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import * as uuid from 'uuid';
import { URLSearchParams } from 'url';
import { HttpClient } from '../../../src/lib/http/http-client';
import {
  NhsApiPlatformAuthenticationService,
  type NhsApiPlatformAuthResponse,
  type NhsApiPlatformConfig
} from '../../../src/lib/nhs-api-platform/nhs-api-platform-authentication-service';

jest.mock('uuid');
const mockUUID = 'mockUUID';
jest.spyOn(uuid, 'v4').mockReturnValue(mockUUID);

const mockDate = Date.now();
jest.useFakeTimers().setSystemTime(mockDate);

describe('nhs-api-platform-authentication-service tests', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();

  let httpClient: Sinon.SinonStubbedInstance<HttpClient>;
  let nhsApiPlatformAuthenticationService: NhsApiPlatformAuthenticationService;

  let keyPair: { publicKey: string; privateKey: string };
  let apiPlatformConfig: NhsApiPlatformConfig;

  const tokenResponse: NhsApiPlatformAuthResponse = {
    access_token: 'accessToken',
    expires_in: '120',
    token_type: 'Bearer',
    issued_at: '1234567890'
  };

  const baseUrl = 'https://mock-api.nhs.uk';

  beforeAll(async () => {
    const genKeys = promisify(generateKeyPair);

    keyPair = await genKeys('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs1',
        format: 'pem'
      }
    });

    apiPlatformConfig = {
      baseUrl,
      apiKey: 'someApiKey',
      keyId: 'someKeyId',
      privateKey: keyPair.privateKey,
      jwtExpirationSeconds: 300
    };
  });

  beforeEach(() => {
    httpClient = sandbox.createStubInstance(HttpClient);
    nhsApiPlatformAuthenticationService =
      new NhsApiPlatformAuthenticationService(
        apiPlatformConfig,
        httpClient as unknown as HttpClient
      );
  });

  afterEach(() => {
    sandbox.reset();
  });

  test('should generate jwt with correct payload and headers', async () => {
    httpClient.doPostRequest.resolves(tokenResponse);
    await nhsApiPlatformAuthenticationService.getToken();

    const reqEncodedParams = httpClient.doPostRequest.args[0][1];
    const reqParams = new URLSearchParams(reqEncodedParams as string);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const jwtToken = reqParams.get('client_assertion')!;

    const decodedToken: jwt.Jwt | null = jwt.verify(
      jwtToken,
      keyPair.publicKey,
      {
        complete: true
      }
    );

    const expectedHeader = {
      typ: 'JWT',
      alg: 'RS512',
      kid: apiPlatformConfig.keyId
    };

    const expectedPayload = {
      sub: apiPlatformConfig.apiKey,
      iss: apiPlatformConfig.apiKey,
      aud: baseUrl + '/oauth2/token',
      exp:
        Math.floor(Date.now() / 1000) + apiPlatformConfig.jwtExpirationSeconds,
      iat: Math.floor(Date.now() / 1000),
      jti: 'mockUUID'
    };

    expect(decodedToken).not.toBeNull();
    expect(decodedToken?.header).toEqual(expectedHeader);
    expect(decodedToken?.payload).toEqual(expectedPayload);
  });

  test('should send request with correct headers and body', async () => {
    httpClient.doPostRequest.resolves(tokenResponse);
    await nhsApiPlatformAuthenticationService.getToken();

    const reqArgs = httpClient.doPostRequest.args[0];

    const reqUrl = reqArgs[0];
    const reqParams = new URLSearchParams(reqArgs[1] as string);
    const reqHeaders = reqArgs[2];

    expect(reqUrl).toEqual(baseUrl + '/oauth2/token');

    expect(reqParams.get('grant_type')).toEqual('client_credentials');
    expect(reqParams.get('client_assertion_type')).toEqual(
      'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'
    );
    expect(reqHeaders?.['Content-Type']).toEqual(
      'application/x-www-form-urlencoded'
    );
  });

  test('should return access token', async () => {
    httpClient.doPostRequest.resolves(tokenResponse);
    const accessToken = await nhsApiPlatformAuthenticationService.getToken();

    expect(accessToken).toEqual(tokenResponse.access_token);
  });

  test('should return access token from cache on second invocation', async () => {
    httpClient.doPostRequest.resolves(tokenResponse);
    const firstInvocationToken =
      await nhsApiPlatformAuthenticationService.getToken();
    const secondInvocationToken =
      await nhsApiPlatformAuthenticationService.getToken();

    expect(httpClient.doPostRequest.calledOnce).toBeTruthy();
    expect(firstInvocationToken).toEqual(tokenResponse.access_token);
    expect(secondInvocationToken).toEqual(tokenResponse.access_token);
  });

  test('should retrieve new access token when expired', async () => {
    tokenResponse.expires_in = '0';
    httpClient.doPostRequest.resolves(tokenResponse);
    const firstInvocationToken =
      await nhsApiPlatformAuthenticationService.getToken();
    const secondInvocationToken =
      await nhsApiPlatformAuthenticationService.getToken();

    expect(httpClient.doPostRequest.calledTwice).toBeTruthy();
    expect(firstInvocationToken).toEqual(tokenResponse.access_token);
    expect(secondInvocationToken).toEqual(tokenResponse.access_token);
  });
});
