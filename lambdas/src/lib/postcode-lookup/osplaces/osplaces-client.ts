import axios, { AxiosInstance, AxiosResponse } from 'axios';
import https from 'https';
import { OSPlacesResponse } from './models/osplaces-response';
import { PostcodeLookupClientConfig } from 'src/lib/models/postcode-lookup-client-config';
import { PostcodeLookupClient } from '../postcode-lookup-client-interface';
import { PostcodeLookupResponse } from '../models/postcode-lookup-response';
import { Address } from '../models/address';

export class OSPlacesClient implements PostcodeLookupClient {
  private readonly client: AxiosInstance;
  private readonly config: PostcodeLookupClientConfig;

  constructor(config: PostcodeLookupClientConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeoutMs,
      headers: {
        "key": this.config.credentials.apiKey,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: this.config.rejectUnauthorized
      })
    });
  }

  async lookupPostcode(postcode: string): Promise<PostcodeLookupResponse> {
    try {
      const response: AxiosResponse<OSPlacesResponse> = await this.client.get('/find', {
        params: {
          query: postcode.replace(/\s+/g, ''),
        }
      });

      if (!response.data.results || response.data.results.length === 0) {
        return {
          postcode,
          addresses: [],
          status: 'not_found',
        };
      }

      return {
        postcode,
        addresses: response.data.results.map((result) => this.mapToAddress(result.DPA)),
        status: 'found',
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return {
          postcode,
          addresses: [],
          status: 'error',
        };
      }
      throw new Error(`Failed to lookup postcode: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private mapToAddress(dpa: NonNullable<OSPlacesResponse['results']>[number]['DPA']): Address {
    let addressLines: string[] = [];

    const premises = [dpa.BUILDING_NUMBER || '', dpa.SUB_BUILDING_NAME || '', dpa.BUILDING_NAME || ''].filter(item => item);
    const thoroughfareLocality = [dpa.DEPENDENT_THOROUGHFARE_NAME || '', dpa.THOROUGHFARE_NAME || '', dpa.DOUBLE_DEPENDENT_LOCALITY || '', dpa.DEPENDENT_LOCALITY || ''].filter(item => item);

    let premisesThoroughfareLocality = '';

    const regex = /(^[1-9]+[a-zA-Z]$)|(^[1-9]+-[1-9]+$)/;
    if(regex.test(dpa.SUB_BUILDING_NAME || '') || regex.test(dpa.BUILDING_NAME || '') || (dpa.BUILDING_NUMBER || '') !== '') {
        premisesThoroughfareLocality = `${premises[0]} ${thoroughfareLocality[0]}`;
        thoroughfareLocality.shift();
        premises.shift();
    }

    addressLines.push(dpa.ORGANISATION_NAME || '', dpa.DEPARTMENT_NAME || '');

    addressLines = addressLines.concat(premises);
    addressLines = addressLines.concat(premisesThoroughfareLocality);
    addressLines = addressLines.concat(thoroughfareLocality);

    addressLines = [ ...new Set(addressLines) ];
    addressLines = addressLines.filter(item => item);

    return {
      id: dpa.UPRN,
      line1: addressLines[0],
      line2: addressLines[1] || '',
      line3: addressLines[2] || '',
      town: dpa.POST_TOWN || '',
      postcode: dpa.POSTCODE || '',
      fullAddress: addressLines.join(', ').concat(`, ${dpa.POST_TOWN || ''}, ${dpa.POSTCODE || ''}`).replace(/,\s*,/g, ',').replace(/,\s*$/, ''),
    };
  }
}
