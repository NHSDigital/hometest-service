import Sinon from 'ts-sinon';
import { Commons } from '../../../src/lib/commons';
import { HttpClient } from '../../../src/lib/http/http-client';
import { LogMethodNames, TestUtil } from '../../util/test-util';
import { OsPlacesHttpClient } from '../../../src/lib/http/os-places-http-client';

describe('OsPlacesHttpClient', () => {
  const endpoint = 'mockEndpoint';
  const apiKey = 'key';
  const postcode = 'AB1 23';
  const osPlacesResponse = {
    results: []
  };
  const expectedUrl = `${endpoint}/postcode?postcode=${postcode}&key=${apiKey}&lr=EN&format=JSON&maxresults=100&dataset=DPA`;
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();

  let service: OsPlacesHttpClient;
  let testUtil: TestUtil;
  let commons: Sinon.SinonStubbedInstance<Commons>;
  let httpClient: Sinon.SinonStubbedInstance<HttpClient>;

  beforeEach(() => {
    commons = sandbox.createStubInstance(Commons);
    httpClient = sandbox.createStubInstance(HttpClient);

    service = new OsPlacesHttpClient(
      commons as unknown as Commons,
      endpoint,
      apiKey,
      httpClient as unknown as HttpClient
    );
    testUtil = new TestUtil(commons, service.className);
  });

  afterEach(() => {
    sandbox.restore();
    jest.resetAllMocks();
  });

  describe('searchForPostcode method', () => {
    it('Makes the GET request with correct params', async () => {
      httpClient.getRequest.resolves(osPlacesResponse);
      const response = await service.searchForPostcode(postcode);

      sandbox.assert.calledOnceWithExactly(
        httpClient.getRequest,
        expectedUrl,
        {}
      );
      expect(response).toMatchObject(osPlacesResponse);
    });

    it('Throws and logs an error when error occurs', async () => {
      const err = new Error('Mock error');
      httpClient.getRequest.throwsException(err);

      await expect(service.searchForPostcode(postcode)).rejects.toThrow(err);

      testUtil.expectLogProduced(
        'the call to os places API ended with an error',
        {
          error: err
        },
        LogMethodNames.ERROR
      );
    });
    it('Does not retry on 400 error and throws immediately', async () => {
      const error = buildErrorFromCode(400);
      httpClient.getRequest.rejects(error);

      await expect(service.searchForPostcode(postcode)).rejects.toThrow(error);

      sandbox.assert.calledOnce(httpClient.getRequest);
    });

    it('Retries 3 times on 5xx errors and then throws', async () => {
      const error = buildErrorFromCode(500);
      httpClient.getRequest.rejects(error);

      await expect(service.searchForPostcode(postcode)).rejects.toThrow(error);

      sandbox.assert.callCount(httpClient.getRequest, 3);
    });

    it('Succeeds after retries with a 200 response following 5xx errors', async () => {
      const error500 = buildErrorFromCode(500);

      // First two attempts will fail with 500
      httpClient.getRequest.onCall(0).rejects(error500);
      httpClient.getRequest.onCall(1).rejects(error500);

      // Third attempt will succeed with a 200 response
      httpClient.getRequest.onCall(2).resolves(osPlacesResponse);

      const response = await service.searchForPostcode(postcode);

      expect(response).toMatchObject(osPlacesResponse);
      sandbox.assert.callCount(httpClient.getRequest, 3);
    });

    function buildErrorFromCode(httpCode: number): Error {
      return new Error('Mock error', { cause: { details: { httpCode } } });
    }
  });
});
