jest.mock("@/settings", () => ({ backendUrl: "http://mock-backend" }));
import laLookupService, { LaLookupResponse } from "./la-lookup-service";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("LaLookupService", () => {
  const postcode = "M503UQ";
  const apiUrl = `http://mock-backend/eligibility-lookup?postcode=${postcode}`;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return local authority data for a valid postcode", async () => {
    const mockResponse: LaLookupResponse = {
      localAuthorityCode: "4230",
      region: "Salford",
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
    await expect(laLookupService.getByPostcode(postcode)).rejects.toThrow("Failed to fetch local authority");
    expect(mockFetch).toHaveBeenCalledWith(apiUrl, expect.objectContaining({ method: "GET" }));
  });

  it("should call the API with the correct URL and headers", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ localAuthorityCode: "4230", region: "Salford" }),
    });
    await laLookupService.getByPostcode(postcode);
    expect(mockFetch).toHaveBeenCalledWith(apiUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  });
});
