import { PostcodeLookupResponse } from "./models/postcode-lookup-response";
import { PostcodeLookupClient } from "./postcode-lookup-client-interface";
import { PostcodeLookupService } from "./postcode-lookup-service";

describe("PostcodeLookupService", () => {
  let service: PostcodeLookupService;
  let mockClient: jest.Mocked<PostcodeLookupClient>;

  beforeEach(() => {
    mockClient = {
      lookupPostcode: jest.fn(),
    } as jest.Mocked<PostcodeLookupClient>;
    service = new PostcodeLookupService(mockClient);
  });

  describe("performLookup", () => {
    const mockResponse: PostcodeLookupResponse = {
      postcode: "SW1A 1AA",
      addresses: [
        {
          id: "100062619632",
          line1: "10 Downing Street",
          line2: "",
          line3: "",
          fullAddress: "10 Downing Street, LONDON, SW1A 1AA",
          town: "LONDON",
          postcode: "SW1A 1AA",
        },
      ],
      status: "found",
    };

    it("should successfully lookup a valid postcode", async () => {
      mockClient.lookupPostcode.mockResolvedValue(mockResponse);

      const result = await service.performLookup("SW1A 1AA");

      expect(result).toEqual(mockResponse);
      expect(mockClient.lookupPostcode).toHaveBeenCalledWith("SW1A 1AA");
    });

    it("should normalize postcode before lookup", async () => {
      mockClient.lookupPostcode.mockResolvedValue(mockResponse);

      await service.performLookup("sw1a 1aa");

      expect(mockClient.lookupPostcode).toHaveBeenCalledWith("SW1A 1AA");
    });

    it("should throw error for invalid postcode format", async () => {
      await expect(service.performLookup("INVALID")).rejects.toThrow("Invalid postcode format");
      expect(mockClient.lookupPostcode).not.toHaveBeenCalled();
    });

    it("should throw error for empty postcode", async () => {
      await expect(service.performLookup("")).rejects.toThrow("Invalid postcode format");
      expect(mockClient.lookupPostcode).not.toHaveBeenCalled();
    });

    it("should throw error when client lookup fails", async () => {
      mockClient.lookupPostcode.mockRejectedValue(new Error("API error"));

      await expect(service.performLookup("SW1A 1AA")).rejects.toThrow(
        "Failed to lookup postcode: API error",
      );
    });

    it("should handle non-Error exceptions from client", async () => {
      mockClient.lookupPostcode.mockRejectedValue("String error");

      await expect(service.performLookup("SW1A 1AA")).rejects.toThrow(
        "Failed to lookup postcode: Unknown error",
      );
    });

    it("should accept postcode without space", async () => {
      mockClient.lookupPostcode.mockResolvedValue(mockResponse);

      await service.performLookup("SW1A1AA");

      expect(mockClient.lookupPostcode).toHaveBeenCalledWith("SW1A1AA");
    });

    it("should accept various valid postcode formats", async () => {
      mockClient.lookupPostcode.mockResolvedValue(mockResponse);

      const validPostcodes = ["M1 1AA", "B33 8TH", "CR2 6XH", "DN55 1PT", "W1A 0AX", "EC1A 1BB"];

      for (const postcode of validPostcodes) {
        await service.performLookup(postcode);
      }

      expect(mockClient.lookupPostcode).toHaveBeenCalledTimes(validPostcodes.length);
    });

    it("should reject postcode with invalid characters", async () => {
      await expect(service.performLookup("SW1@ 1AA")).rejects.toThrow("Invalid postcode format");
    });

    it("should reject postcode that is too short", async () => {
      await expect(service.performLookup("M1")).rejects.toThrow("Invalid postcode format");
    });

    it("should reject postcode that is too long", async () => {
      await expect(service.performLookup("SW1A 1AA 1BB")).rejects.toThrow(
        "Invalid postcode format",
      );
    });
  });
});
