import { OSPlacesClient } from './osplaces-client';
import { PostcodeLookupClientConfig } from '../../models/postcode-lookup-client-config';
import axios from 'axios';
import { OSPlacesResponse } from './models/osplaces-response';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OSPlacesClient', () => {
  let client: OSPlacesClient;
  let config: PostcodeLookupClientConfig;
  let mockAxiosInstance: any;

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

    mockAxiosInstance = {
      get: jest.fn(),
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

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

      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      const result = await client.lookupPostcode('SW1A 2AA');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/find', {
        params: {
          query: 'SW1A2AA',
        },
      });

      expect(result).toEqual({
        postcode: 'SW1A 2AA',
        addresses: [
          {
            id: '100062619632',
            fullAddress: '10 DOWNING STREET, LONDON, SW1A 2AA',
            line1: '10 DOWNING STREET',
            line2: '',
            line3: '',
            town: 'LONDON',
            postcode: 'SW1A 2AA',
          },
          {
            id: '100062619633',
            fullAddress: '11 DOWNING STREET, LONDON, SW1A 2AA',
            line1: '11 DOWNING STREET',
            line2: '',
            line3: '',
            town: 'LONDON',
            postcode: 'SW1A 2AA',
          },
          {
            id: '100062619634',
            fullAddress: 'FLAT 1, EXAMPLE BUILDING, 12 DOWNING STREET, LONDON, SW1A 2AA',
            line1: 'FLAT 1',
            line2: 'EXAMPLE BUILDING',
            line3: '12 DOWNING STREET',
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

      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      const result = await client.lookupPostcode('INVALID');

      expect(result).toEqual({
        postcode: 'INVALID',
        addresses: [],
        status: 'not_found',
      });
    });

    it('should return error status when API returns 404', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 404,
        },
      };

      mockAxiosInstance.get.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = await client.lookupPostcode('NOTFOUND');

      expect(result).toEqual({
        postcode: 'NOTFOUND',
        addresses: [],
        status: 'error',
      });
    });

    it('should throw error when API call fails with non-404 error', async () => {
      const axiosError = new Error('Network error');

      mockAxiosInstance.get.mockRejectedValue(axiosError);

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

      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      await client.lookupPostcode('SW1A  2AA');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/find', {
        params: {
          query: 'SW1A2AA',
        },
      });
    });
  });
});
