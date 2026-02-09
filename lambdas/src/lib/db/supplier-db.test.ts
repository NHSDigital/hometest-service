import { SupplierService } from "./supplier-db";
import { DBClient } from "./db-client";

describe("SupplierService", () => {
  let supplierService: SupplierService;
  let mockDbClient: jest.Mocked<DBClient>;

  beforeEach(() => {
    mockDbClient = {
      query: jest.fn(),
      close: jest.fn(),
    };

    supplierService = new SupplierService({ dbClient: mockDbClient });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getSuppliersByLocalAuthorityAndTest", () => {
    it("should return suppliers for given LA code and test code", async () => {
      const mockRows = [
        {
          supplier_id: "SUP001",
          name: "Test Supplier",
          service_url: "https://example.com/service",
          website_url: "https://example.com",
          region: "North West",
        },
      ];

      mockDbClient.query.mockResolvedValue({
        rows: mockRows,
        rowCount: 1,
      });

      const result = await supplierService.getSuppliersByLocalAuthorityAndTest(
        "LA001",
        "TEST001",
      );

      expect(result).toHaveLength(1);
      expect(result[0].organization).toEqual({
        resourceType: "Organization",
        id: "SUP001",
        name: "Test Supplier",
        extension: [
          {
            url: "http://hometest.nhs.uk/fhir/StructureDefinition/service-url",
            valueUrl: "https://example.com/service",
          },
        ],
      });
      expect(result[0].location).toEqual({
        resourceType: "Location",
        id: "loc-SUP001",
        name: "North West Service Area",
        managingOrganization: {
          reference: "Organization/SUP001",
        },
        address: {
          postalCode: "LA001",
          state: "North West",
        },
      });
      expect(mockDbClient.query).toHaveBeenCalledWith(expect.any(String), [
        "LA001",
        "TEST001",
      ]);
    });

    it("should return suppliers when testCode is not provided", async () => {
      const mockRows = [
        {
          supplier_id: "SUP002",
          name: "Another Supplier",
          service_url: "https://example.com/service2",
          website_url: "https://example.com",
          region: "South East",
        },
      ];

      mockDbClient.query.mockResolvedValue({
        rows: mockRows,
        rowCount: 1,
      });

      const result =
        await supplierService.getSuppliersByLocalAuthorityAndTest("LA002");

      expect(result).toHaveLength(1);
      expect(result[0].organization.id).toBe("SUP002");
      expect(mockDbClient.query).toHaveBeenCalledWith(expect.any(String), [
        "LA002",
        null,
      ]);
    });

    it("should return empty array when no suppliers found", async () => {
      mockDbClient.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await supplierService.getSuppliersByLocalAuthorityAndTest(
        "LA999",
        "TEST999",
      );

      expect(result).toEqual([]);
    });

    it("should return multiple suppliers", async () => {
      const mockRows = [
        {
          supplier_id: "SUP001",
          name: "Supplier One",
          service_url: "https://example.com/service1",
          website_url: "https://example.com",
          region: "Region 1",
        },
        {
          supplier_id: "SUP002",
          name: "Supplier Two",
          service_url: "https://example.com/service2",
          website_url: "https://example.com",
          region: "Region 2",
        },
      ];

      mockDbClient.query.mockResolvedValue({
        rows: mockRows,
        rowCount: 2,
      });

      const result = await supplierService.getSuppliersByLocalAuthorityAndTest(
        "LA001",
        "TEST001",
      );

      expect(result).toHaveLength(2);
      expect(result[0].organization.id).toBe("SUP001");
      expect(result[1].organization.id).toBe("SUP002");
    });

    it("should throw error when database query fails", async () => {
      const dbError = new Error("Database connection failed");
      mockDbClient.query.mockRejectedValue(dbError);

      await expect(
        supplierService.getSuppliersByLocalAuthorityAndTest("LA001", "TEST001"),
      ).rejects.toThrow("Failed to fetch suppliers from database");
    });
  });

  describe("getSupplierConfigBySupplierId", () => {
    it("should return SupplierConfig when supplier exists", async () => {
      mockDbClient.query.mockResolvedValue({
        rows: [
          {
            service_url: "https://supplier.example.com",
            client_secret_name: "secret-name",
            client_id: "client-id",
            oauth_token_path: "/oauth/token",
            order_path: "/orders",
            oauth_scope: "scope-value",
          },
        ],
        rowCount: 1,
      });

      const result =
        await supplierService.getSupplierConfigBySupplierId("SUP001");

      expect(result).toEqual({
        serviceUrl: "https://supplier.example.com",
        clientSecretName: "secret-name",
        clientId: "client-id",
        oauthTokenPath: "/oauth/token",
        orderPath: "/orders",
        oauthScope: "scope-value",
      });
      expect(mockDbClient.query).toHaveBeenCalledWith(expect.any(String), [
        "SUP001",
      ]);
    });

    it("should return null when supplier does not exist", async () => {
      mockDbClient.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result =
        await supplierService.getSupplierConfigBySupplierId("SUP999");
      expect(result).toBeNull();
    });

    it("should throw error when database query fails", async () => {
      mockDbClient.query.mockRejectedValue(new Error("DB failure"));

      await expect(
        supplierService.getSupplierConfigBySupplierId("SUP001"),
      ).rejects.toThrow("Failed to fetch supplier config from database");
    });

    it("should throw error if service_url is missing", async () => {
      mockDbClient.query.mockResolvedValue({
        rows: [
          {
            service_url: null,
            client_secret_name: "secret-name",
            client_id: "client-id",
            oauth_token_path: "/oauth/token",
            order_path: "/orders",
            oauth_scope: "scope-value",
          },
        ],
        rowCount: 1,
      });

      await expect(
        supplierService.getSupplierConfigBySupplierId("SUP001"),
      ).rejects.toThrow("Supplier configuration missing service URL");
    });

    it("should throw error if client_id is missing", async () => {
      mockDbClient.query.mockResolvedValue({
        rows: [
          {
            service_url: "https://supplier.example.com",
            client_secret_name: "secret-name",
            client_id: null,
            oauth_token_path: "/oauth/token",
            order_path: "/orders",
            oauth_scope: "scope-value",
          },
        ],
        rowCount: 1,
      });

      await expect(
        supplierService.getSupplierConfigBySupplierId("SUP001"),
      ).rejects.toThrow("Supplier configuration missing client ID");
    });

    it("should throw error if client_secret_name is missing", async () => {
      mockDbClient.query.mockResolvedValue({
        rows: [
          {
            service_url: "https://supplier.example.com",
            client_secret_name: null,
            client_id: "client-id",
            oauth_token_path: "/oauth/token",
            order_path: "/orders",
            oauth_scope: "scope-value",
          },
        ],
        rowCount: 1,
      });

      await expect(
        supplierService.getSupplierConfigBySupplierId("SUP001"),
      ).rejects.toThrow("Supplier configuration missing client secret name");
    });
  });
});
