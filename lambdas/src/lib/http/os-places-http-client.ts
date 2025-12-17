import { type HttpClient } from './http-client';
import { Service } from '../service';
import { type RawAxiosRequestHeaders } from 'axios';
import { type IOSPlacesResponseModel } from '../models/address/os-places-response-model';
import { type Commons } from '../commons';

export class OsPlacesHttpClient extends Service {
  readonly apiKey: string;
  readonly apiEndpoint: string;
  readonly postcodeApiEndpoint: string;
  readonly httpClient: HttpClient;

  constructor(
    commons: Commons,
    apiEndpoint: string,
    apiKey: string,
    httpClient: HttpClient
  ) {
    super(commons, 'OsPlacesHttpClient');
    this.apiEndpoint = apiEndpoint;
    this.postcodeApiEndpoint = `${this.apiEndpoint}/postcode`;
    this.apiKey = apiKey;
    this.httpClient = httpClient;
  }

  public async searchForPostcode(
    postcode: string
  ): Promise<IOSPlacesResponseModel> {
    const maxRetries = 3; // method will try to perform the call up to 3 times

    let numberOfTries = 0;
    while (true) {
      numberOfTries++;
      try {
        this.logger.debug('attempting call to OS Places API', {
          postcode,
          numberOfTries
        });
        return await this.doSearchForPostcode(postcode);
      } catch (error: any) {
        const httpCode = error?.cause?.details?.httpCode;

        const isRetriable =
          httpCode === 429 || (httpCode >= 500 && httpCode < 600);
        const shouldRetry = isRetriable && numberOfTries < maxRetries;

        if (!shouldRetry) {
          throw error;
        }
      }
    }
  }

  private async doSearchForPostcode(
    postcode: string
  ): Promise<IOSPlacesResponseModel> {
    try {
      const headers: RawAxiosRequestHeaders = {};
      const url = `${this.postcodeApiEndpoint}?postcode=${postcode}&key=${this.apiKey}&lr=EN&format=JSON&maxresults=100&dataset=DPA`;
      const response: IOSPlacesResponseModel =
        await this.httpClient.getRequest<any>(url, headers);
      return response;
    } catch (error) {
      this.logger.error('the call to os places API ended with an error', {
        error
      });
      throw error;
    }
  }
}
