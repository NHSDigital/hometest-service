import type { WireMockMapping } from "../../api/clients/WireMockClient";

interface PostcodeAddress {
  UPRN: string;
  UDPRN: string;
  ADDRESS: string;
  BUILDING_NUMBER: string;
  THOROUGHFARE_NAME: string;
  POST_TOWN: string;
  POSTCODE: string;
}

interface OSPlacesResponse {
  header: {
    uri: string;
    query: string;
    offset: number;
    totalresults: number;
    format: string;
    dataset: string;
    lr: string;
    maxresults: number;
    epoch: string;
    output_srs: string;
  };
  results: Array<{ DPA: PostcodeAddress }>;
}

interface PostcodeLookupMappingOptions {
  postcode: string;
  addresses: PostcodeAddress[];
  priority?: number;
}

export function createOSPlacesSuccessMapping(
  options: PostcodeLookupMappingOptions,
): WireMockMapping {
  const postcodeNoSpaces = options.postcode.replace(/\s/g, "");

  const response: OSPlacesResponse = {
    header: {
      uri: `http://localhost/find?query=${postcodeNoSpaces}`,
      query: `query=${postcodeNoSpaces}`,
      offset: 0,
      totalresults: options.addresses.length,
      format: "JSON",
      dataset: "DPA",
      lr: "EN",
      maxresults: 100,
      epoch: "95",
      output_srs: "EPSG:27700",
    },
    results: options.addresses.map((address) => ({ DPA: address })),
  };

  return {
    priority: options.priority ?? 5,
    request: {
      method: "GET",
      urlPath: "/find",
      queryParameters: {
        query: { equalTo: postcodeNoSpaces },
      },
    },
    response: {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
      jsonBody: response,
    },
  };
}

export function createOSPlacesNotFoundMapping(
  postcode: string,
  options: { priority?: number } = {},
): WireMockMapping {
  const postcodeNoSpaces = postcode.replace(/\s/g, "");

  return {
    priority: options.priority ?? 5,
    request: {
      method: "GET",
      urlPath: "/find",
      queryParameters: {
        query: { equalTo: postcodeNoSpaces },
      },
    },
    response: {
      status: 404,
      headers: {
        "Content-Type": "application/json",
      },
      jsonBody: {
        error: {
          statuscode: 404,
          message: "No results found",
        },
      },
    },
  };
}

export function createDefaultTestAddresses(postcode: string): PostcodeAddress[] {
  return [
    {
      UPRN: "100060000001",
      UDPRN: "200000000001",
      ADDRESS: `1 TEST STREET, TEST TOWN, ${postcode}`,
      BUILDING_NUMBER: "1",
      THOROUGHFARE_NAME: "TEST STREET",
      POST_TOWN: "TEST TOWN",
      POSTCODE: postcode,
    },
    {
      UPRN: "100060000002",
      UDPRN: "200000000002",
      ADDRESS: `2 TEST STREET, TEST TOWN, ${postcode}`,
      BUILDING_NUMBER: "2",
      THOROUGHFARE_NAME: "TEST STREET",
      POST_TOWN: "TEST TOWN",
      POSTCODE: postcode,
    },
  ];
}

export function createOSPlacesCatchAllMapping(): WireMockMapping {
  return {
    priority: 100,
    request: {
      method: "GET",
      urlPath: "/find",
      queryParameters: { query: { matches: ".*" } },
    },
    response: {
      status: 200,
      headers: { "Content-Type": "application/json" },
      jsonBody: {
        header: {
          uri: "http://wiremock/find",
          query: "query=SW1A1AA",
          offset: 0,
          totalresults: 1,
          format: "JSON",
          dataset: "DPA",
          lr: "EN",
          maxresults: 100,
          epoch: "95",
          output_srs: "EPSG:27700",
        },
        results: [
          {
            DPA: {
              UPRN: "100023336956",
              UDPRN: "52640002",
              ADDRESS: "10 DOWNING STREET, LONDON, SW1A 1AA",
              BUILDING_NUMBER: "10",
              THOROUGHFARE_NAME: "DOWNING STREET",
              POST_TOWN: "LONDON",
              POSTCODE: "SW1A 1AA",
            },
          },
        ],
      },
    },
  };
}
