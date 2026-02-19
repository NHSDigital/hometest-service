import postcodeLaMapping from './postcode-la-mapping.json';

export interface LaLookupResult {
  localAuthorityCode: string;
  region: string;
}

export class LaLookupService {
  async lookupByPostcode(postcode: string): Promise<LaLookupResult | null> {
    const normalized = postcode.replace(/\s+/g, '').toUpperCase();
    const stubbed = (postcodeLaMapping as Record<string, LaLookupResult>)[normalized];
    return stubbed ?? null;
  }
}
