import { PostcodeLookupClientConfig } from "src/lib/models/postcode-lookup-client-config";

import { PostcodeLookupResponse } from "../models/postcode-lookup-response";
import { PostcodeLookupClient } from "../postcode-lookup-client-interface";

/**
 * Stub implementation of PostcodeLookupClient for testing and development
 */
export class StubPostcodeLookupClient implements PostcodeLookupClient {
  private readonly stubData: Map<string, PostcodeLookupResponse>;
  private readonly config: PostcodeLookupClientConfig;

  constructor(config: PostcodeLookupClientConfig) {
    this.config = config;
    this.stubData = new Map([
      [
        "SW1A1AA",
        {
          postcode: "SW1A 1AA",
          addresses: [
            {
              id: "SW1A1AA-1",
              line1: "Prime Minister & First Lord Of The Treasury",
              line2: "10 Downing Street",
              line3: "",
              town: "London",
              postcode: "SW1A 1AA",
              fullAddress:
                "Prime Minister & First Lord Of The Treasury, 10 Downing Street, London, SW1A 1AA",
            },
          ],
          status: "found",
        },
      ],
      [
        "EC1A1BB",
        {
          postcode: "EC1A 1BB",
          addresses: [
            {
              id: "EC1A1BB-1",
              line1: "Example House",
              line2: "1 Example Street",
              line3: "",
              town: "London",
              postcode: "EC1A 1BB",
              fullAddress: "Example House, 1 Example Street, London, EC1A 1BB",
            },
            {
              id: "EC1A1BB-2",
              line1: "Example House",
              line2: "2 Example Street",
              line3: "",
              town: "London",
              postcode: "EC1A 1BB",
              fullAddress: "Example House, 2 Example Street, London, EC1A 1BB",
            },
          ],
          status: "found",
        },
      ],
      [
        "M11AE",
        {
          postcode: "M1 1AE",
          addresses: [
            {
              id: "M11AE-1",
              line1: "Test Building",
              line2: "Test Road",
              line3: "",
              town: "Manchester",
              postcode: "M1 1AE",
              fullAddress: "Test Building, Test Road, Manchester, M1 1AE",
            },
          ],
          status: "found",
        },
      ],
      [
        "M10EE",
        {
          postcode: "M1 0EE",
          addresses: null,
          status: "error",
        },
      ],
    ]);
  }

  async lookupPostcode(postcode: string): Promise<PostcodeLookupResponse> {
    return (
      this.stubData.get(postcode) || {
        postcode,
        addresses: null,
        status: "not_found",
      }
    );
  }

  addStubResult(postcode: string, result: PostcodeLookupResponse): void {
    const normalizedPostcode = postcode.replaceAll(/\s/g, "").toUpperCase();
    this.stubData.set(normalizedPostcode, result);
  }

  clear(): void {
    this.stubData.clear();
  }
}
