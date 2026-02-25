import { PostcodeLookupClient } from './postcode-lookup-client-interface';
import { PostcodeLookupResponse } from './models/postcode-lookup-response';

export class PostcodeLookupService {
  private readonly client: PostcodeLookupClient;

  constructor(client: PostcodeLookupClient) {
    this.client = client;
  }

  async performLookup(postcode: string): Promise<PostcodeLookupResponse> {
    if (!this.isValidPostcodeFormat(postcode)) {
      throw new Error('Invalid postcode format');
    }

    const normalizedPostcode = this.normalizePostcode(postcode);
    try {
      const response = await this.client.lookupPostcode(normalizedPostcode);
      return response;
    } catch (error) {
      throw new Error(`Failed to lookup postcode: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private normalizePostcode(postcode: string): string {
    return postcode.trim().toUpperCase().replace(/\s+/g, ' ');
  }

  private isValidPostcodeFormat(postcode: string): boolean {
    const postcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
    return postcodeRegex.test(postcode.trim());
  }
}
