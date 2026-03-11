import { OSPlacesClient } from './osplaces-client';
import { PostcodeLookupClientConfig } from '../../models/postcode-lookup-client-config';
import { FetchHttpClient, HttpError } from '../../http/http-client';
import { OSPlacesResponse } from './models/osplaces-response';

jest.mock('../../http/http-client', () => {
  const actual = jest.requireActual<typeof import('../../http/http-client')>('../../http/http-client');
  return {
    ...actual,
    FetchHttpClient: jest.fn(),
  };
});
const MockFetchHttpClient = FetchHttpClient as jest.MockedClass<typeof FetchHttpClient>;

describe('OSPlacesClient', () => {
  let client: OSPlacesClient;
  let config: PostcodeLookupClientConfig;
  let mockHttpClient: jest.Mocked<FetchHttpClient>;

  beforeEach(() => {
    config = {
      baseUrl: 'http://localhost',
      timeoutMs: 5000,
      credentials: {
        apiKey: 'test-api-key',
      },
      rejectUnauthorized: true,
      maxRetries: 3,
      retryDelayMs: 1000,
      retryBackoffFactor: 2,
    };

    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      postRaw: jest.fn(),
    } as unknown as jest.Mocked<FetchHttpClient>;

    MockFetchHttpClient.mockImplementation(() => mockHttpClient);

    client = new OSPlacesClient(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('lookupPostcode', () => {
    it('should return addresses when postcode is found', async () => {
      const mockResponse: OSPlacesResponse = {
        header: {
          uri: 'http://localhost/find?query=SW1A2AA',
          query: 'query=SW1A2AA',
          offset: 0,
          totalresults: 2,
          format: 'JSON',
          dataset: 'DPA',
          lr: 'EN',
          maxresults: 100,
          epoch: '95',
          output_srs: 'EPSG:27700',
        },
        results: [
          {
            DPA: {
              UPRN: '100062619632',
              UDPRN: '200000000000',
              BUILDING_NUMBER: '10',
              ADDRESS: '10, DOWNING STREET, LONDON, SW1A 2AA',
              THOROUGHFARE_NAME: 'DOWNING STREET',
              POST_TOWN: 'LONDON',
              POSTCODE: 'SW1A 2AA',
            },
          },
          {
            DPA: {
              UPRN: '100062619633',
              UDPRN: '200000000001',
              BUILDING_NUMBER: '11',
              ADDRESS: '11, DOWNING STREET, LONDON, SW1A 2AA',
              THOROUGHFARE_NAME: 'DOWNING STREET',
              POST_TOWN: 'LONDON',
              POSTCODE: 'SW1A 2AA',
            },
          },
          {
            DPA: {
              UPRN: '100062619634',
              UDPRN: '200000000002',
              BUILDING_NUMBER: '12',
              BUILDING_NAME: 'EXAMPLE BUILDING',
              SUB_BUILDING_NAME: 'FLAT 1',
              ADDRESS: 'FLAT 1, EXAMPLE BUILDING, 12, DOWNING STREET, LONDON, SW1A 2AA',
              THOROUGHFARE_NAME: 'DOWNING STREET',
              POST_TOWN: 'LONDON',
              POSTCODE: 'SW1A 2AA',
            },
          }
        ],
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.lookupPostcode('SW1A 2AA');

      expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost/find?query=SW1A2AA&key=test-api-key');

      expect(result).toEqual({
        postcode: 'SW1A 2AA',
        addresses: [
          {
            id: '100062619632',
            fullAddress: '10 DOWNING STREET, LONDON, SW1A 2AA',
            line1: '10 DOWNING STREET',
            line2: '',
            line3: '',
            line4: '',
            town: 'LONDON',
            postcode: 'SW1A 2AA',
          },
          {
            id: '100062619633',
            fullAddress: '11 DOWNING STREET, LONDON, SW1A 2AA',
            line1: '11 DOWNING STREET',
            line2: '',
            line3: '',
            line4: '',
            town: 'LONDON',
            postcode: 'SW1A 2AA',
          },
          {
            id: '100062619634',
            fullAddress: 'FLAT 1, EXAMPLE BUILDING, 12 DOWNING STREET, LONDON, SW1A 2AA',
            line1: 'FLAT 1',
            line2: 'EXAMPLE BUILDING',
            line3: '12 DOWNING STREET',
            line4: '',
            town: 'LONDON',
            postcode: 'SW1A 2AA',
          }
        ],
        status: 'found',
      });
    });

    it('should return not_found status when no results', async () => {
      const mockResponse: OSPlacesResponse = {
        header: {
          uri: 'http://localhost/find?query=INVALID',
          query: 'query=INVALID',
          offset: 0,
          totalresults: 0,
          format: 'JSON',
          dataset: 'DPA',
          lr: 'EN',
          maxresults: 100,
          epoch: '95',
          output_srs: 'EPSG:27700',
        },
        results: [],
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.lookupPostcode('INVALID');

      expect(result).toEqual({
        postcode: 'INVALID',
        addresses: [],
        status: 'not_found',
      });
    });

    it('should return not_found status when API returns 404', async () => {
      const httpError = new HttpError('HTTP GET request failed with status: 404', 404);

      mockHttpClient.get.mockRejectedValue(httpError);

      const result = await client.lookupPostcode('NOTFOUND');

      expect(result).toEqual({
        postcode: 'NOTFOUND',
        addresses: [],
        status: 'not_found',
      });
    });

    it('should throw error when API call fails with non-404 error', async () => {
      const networkError = new Error('Network error');

      mockHttpClient.get.mockRejectedValue(networkError);

      await expect(client.lookupPostcode('SW1A 2AA')).rejects.toThrow(
        'Failed to lookup postcode: Network error'
      );
    });

    it('should remove spaces from postcode before querying', async () => {
      const mockResponse: OSPlacesResponse = {
        header: {
          uri: 'http://localhost/find?query=SW1A2AA',
          query: 'query=SW1A2AA',
          offset: 0,
          totalresults: 0,
          format: 'JSON',
          dataset: 'DPA',
          lr: 'EN',
          maxresults: 100,
          epoch: '95',
          output_srs: 'EPSG:27700',
        },
        results: [],
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      await client.lookupPostcode('SW1A  2AA');

      expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost/find?query=SW1A2AA&key=test-api-key');
    });
  });
});
