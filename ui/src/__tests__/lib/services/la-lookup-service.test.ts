jest.mock("@/settings", () => ({ backendUrl: "http://mock-backend" }));

import laLookupService, { LaLookupResponse } from "@/lib/services/la-lookup-service";

const mockFetch = jest.fn();
globalThis.fetch = mockFetch;

describe("LaLookupService", () => {
  const postcode = "M503UQ";
  const apiUrl = `http://mock-backend/eligibility-lookup?postcode=${postcode}`;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return local authority data for a valid postcode", async () => {
    const mockResponse: LaLookupResponse = {
      localAuthority: {
        localAuthorityCode: "4230",
        region: "Salford",
      },
      suppliers: [
        { id: "SUP1", name: "Supplier One", testCode: "31676001" },
        { id: "SUP2", name: "Supplier Two", testCode: "PCR" },
      ],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await laLookupService.getByPostcode(postcode);
    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(apiUrl, expect.objectContaining({ method: "GET" }));
  });

  it("should throw an error if the API response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    await expect(laLookupService.getByPostcode(postcode)).rejects.toThrow(
      "Failed to fetch local authority",
    );
    expect(mockFetch).toHaveBeenCalledWith(apiUrl, expect.objectContaining({ method: "GET" }));
  });

  it("should call the API with the correct URL and headers", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        localAuthority: { localAuthorityCode: "4230", region: "Salford" },
        suppliers: [{ id: "SUP1", name: "Supplier One", testCode: "31676001" }],
      }),
    });
    await laLookupService.getByPostcode(postcode);
    expect(mockFetch).toHaveBeenCalledWith(apiUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  });
});
