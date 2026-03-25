import { Address, PostcodeLookupResponse } from "../models/postcode-lookup-response";
import { FetchHttpClient, HttpError } from "../../http/http-client";

import { OSPlacesResponse } from "./models/osplaces-response";
import { PostcodeLookupClient } from "../postcode-lookup-client-interface";
import { PostcodeLookupClientConfig } from "src/lib/models/postcode-lookup-client-config";

export class OSPlacesClient implements PostcodeLookupClient {
  private readonly client: FetchHttpClient;
  private readonly config: PostcodeLookupClientConfig;

  constructor(config: PostcodeLookupClientConfig) {
    this.config = config;
    this.client = new FetchHttpClient({ rejectUnauthorized: config.rejectUnauthorized });
  }

  async lookupPostcode(postcode: string): Promise<PostcodeLookupResponse> {
    try {
      const url = new URL(this.config.baseUrl + "/find", this.config.baseUrl);
      url.searchParams.append("query", postcode.replaceAll(/\s+/g, ""));
      url.searchParams.append("key", this.config.credentials.apiKey);
      const response = await this.client.get<OSPlacesResponse>(url.toString());

      if (!response.results || response.results.length === 0) {
        return {
          postcode,
          addresses: [],
          status: "not_found",
        };
      }

      return {
        postcode,
        addresses: response.results.map((result) => this.mapToAddress(result.DPA)),
        status: "found",
      };
    } catch (error) {
      if (error instanceof HttpError && error.status === 404) {
        return {
          postcode,
          addresses: [],
          status: "not_found",
        };
      }
      throw new Error(
        `Failed to lookup postcode: ${error instanceof Error ? error.message : "Unknown error"}`,
        { cause: error },
      );
    }
  }

  private mapToAddress(dpa: NonNullable<OSPlacesResponse["results"]>[number]["DPA"]): Address {
    let addressLines: string[] = [];

    const premises = [
      dpa.BUILDING_NUMBER || "",
      dpa.SUB_BUILDING_NAME || "",
      dpa.BUILDING_NAME || "",
    ].filter(Boolean);

    const thoroughfareLocality = [
      dpa.DEPENDENT_THOROUGHFARE_NAME || "",
      dpa.THOROUGHFARE_NAME || "",
      dpa.DOUBLE_DEPENDENT_LOCALITY || "",
      dpa.DEPENDENT_LOCALITY || "",
    ].filter(Boolean);

    let premisesThoroughfareLocality = "";

    const regex = /(^[1-9]+[a-zA-Z]$)|(^[1-9]+-[1-9]+$)/;
    if (
      regex.test(dpa.SUB_BUILDING_NAME || "") ||
      regex.test(dpa.BUILDING_NAME || "") ||
      (dpa.BUILDING_NUMBER || "") !== ""
    ) {
      premisesThoroughfareLocality = `${premises[0]} ${thoroughfareLocality[0]}`;
      thoroughfareLocality.shift();
      premises.shift();
    }

    addressLines.push(dpa.ORGANISATION_NAME || "", dpa.DEPARTMENT_NAME || "");

    addressLines = addressLines.concat(premises);
    addressLines = addressLines.concat(premisesThoroughfareLocality);
    addressLines = addressLines.concat(thoroughfareLocality);

    addressLines = [...new Set(addressLines)];
    addressLines = addressLines.filter(Boolean);

    if (addressLines.length === 0) {
      throw new Error(
        `Invalid address data for UPRN ${dpa.UPRN} and Postcode ${dpa.POSTCODE}: No valid address lines could be constructed`,
      );
    }

    return {
      id: dpa.UPRN,
      line1: addressLines[0],
      line2: addressLines[1] || "",
      line3: addressLines[2] || "",
      line4: addressLines[3] || "",
      town: dpa.POST_TOWN || "",
      postcode: dpa.POSTCODE || "",
      fullAddress: addressLines
        .join(", ")
        .concat(`, ${dpa.POST_TOWN || ""}, ${dpa.POSTCODE || ""}`)
        .replaceAll(/,\s*,/g, ",")
        .replace(/,\s*$/, ""),
    };
  }
}
