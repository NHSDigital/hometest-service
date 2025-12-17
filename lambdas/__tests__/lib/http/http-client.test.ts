import Sinon from 'ts-sinon';
import { Commons } from '../../../src/lib/commons';
import {
  type CustomLookupType,
  HttpClient
} from '../../../src/lib/http/http-client';
import axios from 'axios';
import { Resolver } from 'node:dns';
import { LogMethodNames, TestUtil } from '../../util/test-util';

jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  isAxiosError: jest.fn()
}));

describe('HttpClient', () => {
  const axiosPostMock = axios.post as jest.Mock;
  const axiosGetMock = axios.get as jest.Mock;
  const axiosPutMock = axios.put as jest.Mock;
  const axiosDeleteMock = axios.delete as jest.Mock;
  const isAxiosErrorMock = axios.isAxiosError as unknown as jest.Mock;
  const mockEndpoint = 'https://mockendpoint.com';
  const mockRequestPayload = '<xml>ooh it is an XML</xml>';
  const mockHeaders = { something: 'header' };
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();

  let service: HttpClient;
  let testUtil: TestUtil;
  let commons: Sinon.SinonStubbedInstance<Commons>;
  let resolve4Mock: jest.Mock;
  let resolve6Mock: jest.Mock;
  let getServersMock: jest.Mock;
  let setServersMock: jest.Mock;

  beforeEach(() => {
    commons = sandbox.createStubInstance(Commons);

    resolve4Mock = jest.fn();
    jest.spyOn(Resolver.prototype, 'resolve4').mockImplementation(resolve4Mock);
    resolve6Mock = jest.fn();
    jest.spyOn(Resolver.prototype, 'resolve6').mockImplementation(resolve6Mock);
    getServersMock = jest.fn();
    jest
      .spyOn(Resolver.prototype, 'getServers')
      .mockImplementation(getServersMock);
    setServersMock = jest.fn();
    jest
      .spyOn(Resolver.prototype, 'setServers')
      .mockImplementation(setServersMock);

    service = new HttpClient(commons as unknown as Commons);
    testUtil = new TestUtil(commons, service.className);
    axiosPostMock.mockResolvedValue({});
    axiosGetMock.mockResolvedValue({});
    axiosPutMock.mockResolvedValue({});
    getServersMock.mockReturnValue(['mockDefaultDns']);
  });

  afterEach(() => {
    sandbox.restore();
    jest.resetAllMocks();
  });

  describe('[HSCN] custom lookup', () => {
    let customLookup: CustomLookupType;
    const customDnsServers = ['333.333.333.333'];

    beforeEach(() => {
      commons = sandbox.createStubInstance(Commons);
      getServersMock.mockReturnValue(['mockDefaultDns']);

      service = new HttpClient(commons as unknown as Commons, {
        additionalDnsServers: customDnsServers
      });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      customLookup = service['customLookup']!;
      testUtil = new TestUtil(commons, service.className);

      resolve4Mock.mockImplementation((hostname, cb) => {
        cb(null, [`${hostname}.ip`]);
      });
      resolve6Mock.mockImplementation((hostname, cb) => {
        cb(null, [`${hostname}.ipv6`]);
      });
    });

    afterEach(() => {
      sandbox.restore();
      jest.resetAllMocks();
    });

    it('Sets up the request with correct custom DNS in constructor', async () => {
      expect(setServersMock).toHaveBeenCalledTimes(1);
      expect(setServersMock).toHaveBeenCalledWith([
        '333.333.333.333',
        'mockDefaultDns'
      ]);
    });

    it('Does the correct IPv4 lookup by default', (resolve) => {
      expect.assertions(3);
      resolve4Mock.mockImplementation((hostname, cb) => {
        cb(null, [`${hostname}.ip`]);
      });
      customLookup('some.domain', {}, (err, address, IPfamily) => {
        expect(err).toBeNull();
        expect(address).toEqual('some.domain.ip');
        expect(IPfamily).toEqual(4);
        resolve();
      });
    });

    it('Does the correct IPv6 lookup by if option to use it is set', (resolve) => {
      expect.assertions(3);
      customLookup('some.domain', { family: 6 }, (err, address, IPfamily) => {
        expect(err).toBeNull();
        expect(address).toEqual('some.domain.ipv6');
        expect(IPfamily).toEqual(6);
        resolve();
      });
    });

    it('Returns the error from the resolver', (resolve) => {
      expect.assertions(1);
      const mockError = new Error('Oh no');
      resolve4Mock.mockImplementation((hostname, cb) => {
        cb(mockError, []);
      });

      customLookup('some.domain', {}, (err) => {
        expect(err).toEqual(mockError);
        resolve();
      });
    });
  });

  describe.each(['doPostRequestWithStatus', 'doPostRequest'])(
    '%s',
    (testedMethod) => {
      it('Makes the POST request with correct params', async () => {
        await service[testedMethod](
          mockEndpoint,
          mockRequestPayload,
          mockHeaders
        );

        expect(axiosPostMock).toHaveBeenCalledTimes(1);
        expect(axiosPostMock).toHaveBeenCalledWith(
          mockEndpoint,
          mockRequestPayload,
          {
            headers: mockHeaders,
            timeout: 30 * 1000
          }
        );

        expect(resolve4Mock).not.toHaveBeenCalled();
        expect(resolve6Mock).not.toHaveBeenCalled();
        expect(setServersMock).not.toHaveBeenCalled();
      });

      it('[HSCN] Makes the POST request with custom DNS lookup when additional DNS provided', async () => {
        const customDnsServers = ['333.333.333.333'];
        service = new HttpClient(commons as unknown as Commons, {
          additionalDnsServers: customDnsServers
        });

        const customLookup = service['customLookup'];

        await service[testedMethod](
          mockEndpoint,
          mockRequestPayload,
          mockHeaders
        );

        expect(customLookup).toBeDefined();
        expect(axiosPostMock).toHaveBeenCalledTimes(1);
        expect(axiosPostMock).toHaveBeenCalledWith(
          mockEndpoint,
          mockRequestPayload,
          {
            headers: mockHeaders,
            timeout: 30 * 1000,
            lookup: customLookup
          }
        );
      });

      it('Throws and logs an error when error occurs', async () => {
        axiosPostMock.mockRejectedValue(new Error('Mock error'));
        const expectedErrorDetails = {
          errorMessage: 'Mock error',
          errorCode: undefined,
          responseStatus: undefined,
          responseData: undefined,
          errorCause: undefined,
          isHttpError: true
        };
        await expect(
          service[testedMethod](mockEndpoint, mockRequestPayload, mockHeaders)
        ).rejects.toThrow(
          new Error('Post API call failure', {
            cause: { details: expectedErrorDetails }
          })
        );

        testUtil.expectLogProduced(
          'doPostRequest error',
          expectedErrorDetails,
          LogMethodNames.ERROR
        );
      });
    }
  );

  describe('doPostRequestWithStatus', () => {
    const mockResponse = { status: 200, data: 'Some data' };
    it('Returns the correct data and status', async () => {
      axiosPostMock.mockResolvedValue(mockResponse);
      const response = await service.doPostRequestWithStatus(
        mockEndpoint,
        mockRequestPayload,
        mockHeaders
      );

      expect(response).toEqual({
        httpCode: mockResponse.status,
        data: mockResponse.data
      });
    });
  });

  describe.each(['postRequest', 'doPostRequest'])('%s', (testedMethod) => {
    const mockResponse = { status: 200, data: 'Some data' };
    it('Returns the correct data', async () => {
      axiosPostMock.mockResolvedValue(mockResponse);
      const response = await service[testedMethod](
        mockEndpoint,
        mockRequestPayload,
        mockHeaders
      );

      expect(response).toEqual(mockResponse.data);
    });
  });

  describe('postRequest', () => {
    const mockResponse = { status: 200, data: 'Some data' };

    it('Adds the default app/json headers', async () => {
      axiosPostMock.mockResolvedValue(mockResponse);
      await service.postRequest(mockEndpoint, mockRequestPayload, mockHeaders);

      expect(axiosPostMock).toHaveBeenCalledTimes(1);
      expect(axiosPostMock).toHaveBeenCalledWith(
        mockEndpoint,
        mockRequestPayload,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...mockHeaders
          },
          timeout: 30 * 1000
        }
      );
    });

    it('Throws and logs an error when error occurs', async () => {
      axiosPostMock.mockRejectedValue(new Error('Mock error'));
      const expectedErrorDetails = {
        errorMessage: 'Mock error',
        errorCode: undefined,
        responseStatus: undefined,
        responseData: undefined,
        errorCause: undefined,
        isHttpError: true
      };
      await expect(
        service.postRequest(mockEndpoint, mockRequestPayload, mockHeaders)
      ).rejects.toThrow(
        new Error('Post API call failure', {
          cause: { details: expectedErrorDetails }
        })
      );

      testUtil.expectLogProduced(
        'doPostRequest error',
        expectedErrorDetails,
        LogMethodNames.ERROR
      );
    });
  });

  describe('doPutRequestWithStatus', () => {
    const mockResponse = { status: 200, data: 'test data' };

    it('Returns the correct status and data', async () => {
      axiosPutMock.mockResolvedValue(mockResponse);
      const response = await service.doPutRequestWithStatus(
        mockEndpoint,
        mockRequestPayload
      );

      expect(response).toEqual({
        httpCode: mockResponse.status,
        data: mockResponse.data
      });
    });

    it('Makes the PUT request with correct params', async () => {
      await service.doPutRequestWithStatus(
        mockEndpoint,
        mockRequestPayload,
        mockHeaders
      );

      expect(axiosPutMock).toHaveBeenCalledTimes(1);
      expect(axiosPutMock).toHaveBeenCalledWith(
        mockEndpoint,
        mockRequestPayload,
        {
          headers: mockHeaders,
          timeout: 30 * 1000
        }
      );
    });
  });

  describe('putRequest', () => {
    const mockResponse = { status: 200, data: 'test data' };

    it('Returns the correct data', async () => {
      axiosPutMock.mockResolvedValue(mockResponse);
      const response = await service.putRequest(
        mockEndpoint,
        mockRequestPayload
      );

      expect(response).toEqual(mockResponse.data);
    });

    it('Adds the default app/json headers', async () => {
      axiosPutMock.mockResolvedValue(mockResponse);
      await service.putRequest(mockEndpoint, mockRequestPayload, mockHeaders);

      expect(axiosPutMock).toHaveBeenCalledTimes(1);
      expect(axiosPutMock).toHaveBeenCalledWith(
        mockEndpoint,
        mockRequestPayload,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...mockHeaders
          },
          timeout: 30 * 1000
        }
      );
    });
  });

  describe.each(['putRequest', 'doPutRequestWithStatus'])(
    '%s',
    (testedMethod) => {
      it('Throws and logs an error when error occurs', async () => {
        axiosPutMock.mockRejectedValue(new Error('Mock error'));
        const expectedErrorDetails = {
          errorMessage: 'Mock error',
          errorCode: undefined,
          responseStatus: undefined,
          responseData: undefined,
          errorCause: undefined,
          isHttpError: true
        };
        await expect(
          service[testedMethod](mockEndpoint, mockRequestPayload, mockHeaders)
        ).rejects.toThrow(
          new Error('Put API call failure', {
            cause: { details: expectedErrorDetails }
          })
        );

        testUtil.expectLogProduced(
          'doPutRequestWithStatus error',
          expectedErrorDetails,
          LogMethodNames.ERROR
        );
      });
    }
  );

  describe('doGetRequestWithHeaders', () => {
    const mockResponse = {
      status: 200,
      data: 'Some data',
      headers: { Behead: 'Header' }
    };

    it('Adds the default app/json headers and calls the endpoint', async () => {
      const mockEndpointWithParams = `${mockEndpoint}?param=abc`;
      axiosGetMock.mockResolvedValue(mockResponse);
      await service.doGetRequestWithHeaders(
        mockEndpointWithParams,
        mockHeaders
      );

      expect(axiosGetMock).toHaveBeenCalledTimes(1);
      expect(axiosGetMock).toHaveBeenCalledWith(mockEndpointWithParams, {
        headers: mockHeaders,
        withCredentials: false
      });
      testUtil.expectLogProduced(
        'about to trigger GET request to endpoint',
        {
          endpointUrl: `${mockEndpoint}/`
        },
        LogMethodNames.DEBUG
      );
    });

    it('Returns the correct headers and data', async () => {
      axiosGetMock.mockResolvedValue(mockResponse);
      const response = await service.doGetRequestWithHeaders(
        mockEndpoint,
        mockHeaders
      );

      expect(response).toEqual({
        data: mockResponse.data,
        headers: mockResponse.headers
      });
    });
  });

  describe('getRequest', () => {
    const mockResponse = { status: 200, data: 'Some data' };

    it('Adds the default app/json headers and calls the endpoint', async () => {
      const mockEndpointWithParams = `${mockEndpoint}?param=abc`;
      axiosGetMock.mockResolvedValue(mockResponse);
      await service.getRequest(mockEndpointWithParams, mockHeaders);

      expect(axiosGetMock).toHaveBeenCalledTimes(1);
      expect(axiosGetMock).toHaveBeenCalledWith(mockEndpointWithParams, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...mockHeaders
        },
        withCredentials: false
      });
      testUtil.expectLogProduced(
        'about to trigger GET request to endpoint',
        {
          endpointUrl: `${mockEndpoint}/`
        },
        LogMethodNames.DEBUG
      );
    });

    it('Returns the correct data', async () => {
      axiosGetMock.mockResolvedValue(mockResponse);
      const response = await service.getRequest(mockEndpoint, mockHeaders);

      expect(response).toEqual(mockResponse.data);
    });

    it('Throws and logs an error when error occurs', async () => {
      const expectedErrorDetails = {
        errorDetails: {
          httpCode: undefined,
          responseData: undefined,
          cause: undefined,
          name: 'Error',
          code: undefined,
          status: undefined
        }
      };
      axiosGetMock.mockRejectedValue(new Error('Mock error'));
      await expect(
        service.getRequest(mockEndpoint, mockHeaders)
      ).rejects.toThrow(
        new Error('Get API call failure', {
          cause: { details: expectedErrorDetails }
        })
      );

      testUtil.expectLogProduced(
        'getRequest error',
        expectedErrorDetails,
        LogMethodNames.ERROR
      );
    });
  });

  describe('deleteRequest', () => {
    const mockResponse = { status: 200, data: 'hello from the other side' };

    it('returns the correct data', async () => {
      axiosDeleteMock.mockResolvedValue(mockResponse);

      const response = await service.deleteRequest(mockEndpoint);

      expect(response).toEqual(mockResponse.data);
    });

    it('adds the default headers with overrides', async () => {
      axiosDeleteMock.mockResolvedValue(mockResponse);

      await service.deleteRequest(mockEndpoint, mockHeaders);

      expect(axiosDeleteMock).toHaveBeenCalledTimes(1);
      expect(axiosDeleteMock).toHaveBeenCalledWith(mockEndpoint, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...mockHeaders
        }
      });
    });

    it('throws and logs error when error occurs', async () => {
      axiosDeleteMock.mockRejectedValue(new Error('Mock error'));
      const expectedErrorDetails = {
        errorMessage: 'Mock error',
        errorCode: undefined,
        responseStatus: undefined,
        responseData: undefined,
        errorCause: undefined,
        isHttpError: true
      };

      await expect(
        service.deleteRequest(mockEndpoint, mockHeaders)
      ).rejects.toThrow(
        new Error('Delete API call failure', {
          cause: { details: expectedErrorDetails }
        })
      );

      testUtil.expectLogProduced(
        'deleteRequest error',
        expectedErrorDetails,
        LogMethodNames.ERROR
      );
    });
  });

  describe('isHttpError', () => {
    it.each([
      [new Error('mock error'), false],
      [new Error('mock http error'), true],
      [
        new Error('mock error', { cause: { details: { isHttpError: true } } }),
        true
      ],
      [new Error('mock error', { cause: { details: {} } }), false]
    ])(
      'Passes correct params and returns correct value for specific errors based on axios',
      (errorThrown, expectedResult) => {
        isAxiosErrorMock.mockReturnValue(expectedResult);
        expect(HttpClient.isHttpError(errorThrown)).toEqual(expectedResult);

        expect(isAxiosErrorMock).toHaveBeenCalledWith(errorThrown);
      }
    );
  });
});
