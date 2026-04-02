import { Bundle, Observation } from "fhir/r4";

import { SupplierConfig, SupplierService } from "../db/supplier-db";
import { HttpClient } from "../http/http-client";
import { SecretsClient } from "../secrets/secrets-manager-client";
import { SupplierTestResultsService } from "./supplier-test-results-service";

const mockGenerateToken = jest.fn();
const mockTokenGenerator = {
  generateToken: mockGenerateToken,
};

jest.mock("./supplier-auth-client", () => ({
  getOrCreateTokenGenerator: jest.fn(() => mockTokenGenerator),
}));

const { getOrCreateTokenGenerator: mockGetOrCreateTokenGenerator } = jest.requireMock(
  "./supplier-auth-client",
) as {
  getOrCreateTokenGenerator: jest.Mock;
};

describe("SupplierTestResultsService", () => {
  let service: SupplierTestResultsService;
  let mockHttpClient: jest.Mocked<HttpClient>;
  let mockSecretsClient: jest.Mocked<SecretsClient>;
  let mockSupplierDb: jest.Mocked<SupplierService>;

  beforeEach(() => {
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      postRaw: jest.fn(),
    } as jest.Mocked<HttpClient>;

    mockSecretsClient = {
      getSecretValue: jest.fn(),
      getSecretString: jest.fn(),
    } as jest.Mocked<SecretsClient>;

    mockSupplierDb = {
      getSupplierConfigBySupplierId: jest.fn(),
    } as unknown as jest.Mocked<SupplierService>;

    service = new SupplierTestResultsService(mockHttpClient, mockSecretsClient, mockSupplierDb);

    mockGenerateToken.mockReset();
    mockGetOrCreateTokenGenerator.mockClear();
  });

  describe("getResults", () => {
    const orderId = "test-order-123";
    const supplierId = "SUP001";
    const correlationId = "correlation-123";
    const serviceConfig: SupplierConfig = {
      serviceUrl: "https://supplier-api.example.com",
      clientSecretName: "test-secret",
      clientId: "test-client-id",
      oauthTokenPath: "/oauth/token",
      orderPath: "/orders",
      oauthScope: "orders results",
      resultsPath: "/api/results",
    };

    const mockBundle: Bundle<Observation> = {
      resourceType: "Bundle",
      type: "searchset",
      entry: [
        {
          resource: {
            resourceType: "Observation",
            status: "final",
            code: { text: "Test" },
            interpretation: [
              {
                coding: [
                  {
                    system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                    code: "N",
                    display: "Normal",
                  },
                ],
              },
            ],
          },
        },
      ],
    };

    beforeEach(() => {
      mockGenerateToken.mockResolvedValue("test-access-token");
      mockSupplierDb.getSupplierConfigBySupplierId.mockResolvedValue(serviceConfig);
    });

    it("should fetch results from supplier API successfully", async () => {
      mockHttpClient.get.mockResolvedValue(mockBundle);

      const result = await service.getResults(orderId, supplierId, correlationId);

      expect(result).toEqual(mockBundle);
      expect(mockSupplierDb.getSupplierConfigBySupplierId).toHaveBeenCalledWith(supplierId);
      expect(mockGetOrCreateTokenGenerator).toHaveBeenCalledWith(
        mockHttpClient,
        mockSecretsClient,
        serviceConfig,
      );
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        "https://supplier-api.example.com/api/results?order_uid=test-order-123",
        {
          Authorization: "Bearer test-access-token",
          Accept: "application/fhir+json",
          "X-Correlation-ID": correlationId,
        },
      );
    });

    it("should throw error when supplier config is missing", async () => {
      mockSupplierDb.getSupplierConfigBySupplierId.mockResolvedValue(null);

      await expect(service.getResults(orderId, supplierId, correlationId)).rejects.toThrow(
        "Missing supplier config",
      );
    });

    it("should pass correlation ID in request headers", async () => {
      mockHttpClient.get.mockResolvedValue(mockBundle);

      await service.getResults(orderId, supplierId, "custom-correlation-id");

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          "X-Correlation-ID": "custom-correlation-id",
        }),
      );
    });

    it("should properly encode order_uid in query parameters", async () => {
      mockHttpClient.get.mockResolvedValue(mockBundle);
      const orderIdWithSpecialChars = "order-123-abc+def";

      await service.getResults(orderIdWithSpecialChars, supplierId, correlationId);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining("order_uid=order-123-abc%2Bdef"),
        expect.any(Object),
      );
    });

    it("requests token generation for repeated requests", async () => {
      mockHttpClient.get.mockResolvedValue(mockBundle);

      await service.getResults(orderId, supplierId, correlationId);
      await service.getResults(orderId, supplierId, correlationId);

      expect(mockGetOrCreateTokenGenerator).toHaveBeenCalledTimes(2);
      expect(mockGenerateToken).toHaveBeenCalledTimes(2);
    });
  });
});
