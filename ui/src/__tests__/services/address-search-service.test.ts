import { httpClient } from '../../lib/http/http-client';
import addressSearchService from '../../services/address-search-service';

describe('addressSearchService', () => {
  const getRequestSpy = jest.spyOn(httpClient, 'getRequest');
  const mockAddresses = [
    {
      addressLine1: 'UK Mail',
      addressLine2: 'Flat 410',
      addressLine3:
        'Pinnacle Apartments, 11 Saffron Central Square, New Addington',
      townCity: 'Croydon',
      postcode: 'CR0 2GL'
    },
    {
      addressLine1: 'Flat 60',
      addressLine2: 'Alpha Line',
      addressLine3: '35 Wellesley Road',
      townCity: 'Croydon',
      postcode: 'CR0 2GU'
    }
  ];

  beforeEach(() => {
    getRequestSpy.mockResolvedValue({ addressList: mockAddresses });
  });

  afterEach(() => {
    getRequestSpy.mockReset();
  });

  describe('searchForAddress', () => {
    it('calls appropriate endpoint with correct postcode', async () => {
      await addressSearchService.searchForAddress('AB 123');
      expect(getRequestSpy).toHaveBeenCalledTimes(1);
      expect(getRequestSpy).toHaveBeenCalledWith(
        `${process.env.REACT_APP_HTC_BACKEND_API_ENDPOINT}/address?postcode=AB%20123`
      );
    });

    it('returns values from backend', async () => {
      const result = await addressSearchService.searchForAddress('AB 123');
      expect(getRequestSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ addressList: mockAddresses });
    });

    it('adds building number query param if supplied', async () => {
      await addressSearchService.searchForAddress('AB 123', 'FLAT12');
      expect(getRequestSpy).toHaveBeenCalledTimes(1);
      expect(getRequestSpy).toHaveBeenCalledWith(
        `${process.env.REACT_APP_HTC_BACKEND_API_ENDPOINT}/address?postcode=AB%20123&buildingNumber=FLAT12`
      );
    });

    it('encodes GET params', async () => {
      await addressSearchService.searchForAddress('AB 123', 'FLAT>12');
      expect(getRequestSpy).toHaveBeenCalledTimes(1);
      expect(getRequestSpy).toHaveBeenCalledWith(
        `${process.env.REACT_APP_HTC_BACKEND_API_ENDPOINT}/address?postcode=AB%20123&buildingNumber=FLAT%3E12`
      );
    });
  });
});
