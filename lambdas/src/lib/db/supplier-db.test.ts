import { DBClient } from "./db-client";
import { SupplierService } from "./supplier-db";

const normalizeSql = (sql: string): string => sql.replace(/\s+/g, " ").trim();

describe("SupplierService", () => {
  let supplierService: SupplierService;
  let mockDbClient: jest.Mocked<DBClient>;

  beforeEach(() => {
    mockDbClient = {
      query: jest.fn(),
      withTransaction: jest.fn(),
      close: jest.fn(),
    };
    mockDbClient.withTransaction.mockImplementation(async (fn) => fn(mockDbClient));

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
          supplier_name: "Test Supplier",
          service_url: "https://example.com/service",
          website_url: "https://example.com",
          test_code: "TEST001",
        },
      ];

      mockDbClient.query.mockResolvedValue({
        rows: mockRows,
        rowCount: 1,
      });

      const result = await supplierService.getSuppliersByLocalAuthorityAndTest("LA001", "TEST001");

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
        name: undefined,
        managingOrganization: {
          reference: "Organization/SUP001",
        },
        address: {
          postalCode: "LA001",
          state: undefined,
        },
      });
      expect(result[0].testCode).toBe("TEST001");
      expect(mockDbClient.query).toHaveBeenCalledWith(expect.any(String), ["LA001", "TEST001"]);
      expect(mockDbClient.query).toHaveBeenCalledTimes(1);

      const sql = mockDbClient.query.mock.calls[0][0] as string;
      const expectedSql = `
        SELECT s.supplier_id,
          s.supplier_name,
          s.service_url,
          s.website_url,
          o.test_code
        FROM supplier s
          JOIN la_supplier_offering o ON s.supplier_id = o.supplier_id
        WHERE o.la_code = $1
          AND ($2::VARCHAR IS NULL OR o.test_code = $2)
          AND o.effective_from <= CURRENT_TIMESTAMP;
      `;
      expect(normalizeSql(sql)).toBe(normalizeSql(expectedSql));
    });

    it("should return suppliers when testCode is not provided", async () => {
      const mockRows = [
        {
          supplier_id: "SUP002",
          supplier_name: "Another Supplier",
          service_url: "https://example.com/service2",
          website_url: "https://example.com",
          test_code: "TEST002",
        },
      ];

      mockDbClient.query.mockResolvedValue({
        rows: mockRows,
        rowCount: 1,
      });

      const result = await supplierService.getSuppliersByLocalAuthorityAndTest("LA002");

      expect(result).toHaveLength(1);
      expect(result[0].organization.id).toBe("SUP002");
      expect(result[0].testCode).toBe("TEST002");
      expect(mockDbClient.query).toHaveBeenCalledWith(expect.any(String), ["LA002", null]);
      expect(mockDbClient.query).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no suppliers found", async () => {
      mockDbClient.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await supplierService.getSuppliersByLocalAuthorityAndTest("LA999", "TEST999");

      expect(result).toEqual([]);
      expect(mockDbClient.query).toHaveBeenCalledTimes(1);
    });

    it("should return multiple suppliers", async () => {
      const mockRows = [
        {
          supplier_id: "SUP001",
          supplier_name: "Supplier One",
          service_url: "https://example.com/service1",
          website_url: "https://example.com",
          test_code: "TEST001",
        },
        {
          supplier_id: "SUP002",
          supplier_name: "Supplier Two",
          service_url: "https://example.com/service2",
          website_url: "https://example.com",
          test_code: "TEST002",
        },
      ];

      mockDbClient.query.mockResolvedValue({
        rows: mockRows,
        rowCount: 2,
      });

      const result = await supplierService.getSuppliersByLocalAuthorityAndTest("LA001", "TEST001");

      expect(result).toHaveLength(2);
      expect(result[0].organization.id).toBe("SUP001");
      expect(result[1].organization.id).toBe("SUP002");
      expect(result[0].testCode).toBe("TEST001");
      expect(result[1].testCode).toBe("TEST002");
      expect(mockDbClient.query).toHaveBeenCalledTimes(1);
    });

    it("should throw error when database query fails", async () => {
      const dbError = new Error("Database connection failed");
      mockDbClient.query.mockRejectedValue(dbError);

      await expect(
        supplierService.getSuppliersByLocalAuthorityAndTest("LA001", "TEST001"),
      ).rejects.toThrow(/Failed to fetch suppliers from database/);
      expect(mockDbClient.query).toHaveBeenCalledTimes(1);
    });

    it("should throw error with only LA code when database query fails", async () => {
      const dbError = new Error("Database connection failed");
      mockDbClient.query.mockRejectedValue(dbError);

      await expect(supplierService.getSuppliersByLocalAuthorityAndTest("LA001")).rejects.toThrow(
        "Failed to fetch suppliers from database for laCode LA001",
      );
      expect(mockDbClient.query).toHaveBeenCalledTimes(1);
    });
  });

  describe("getSuppliersByLaCode", () => {
    it("should return suppliers for given LA code", async () => {
      mockDbClient.query.mockResolvedValue({
        rows: [
          {
            supplier_id: "SUP001",
            supplier_name: "Supplier One",
          },
          {
            supplier_id: "SUP002",
            supplier_name: "Supplier Two",
          },
        ],
        rowCount: 2,
      });

      const result = await supplierService.getSuppliersByLaCode("LA001");

      expect(result).toEqual([
        { id: "SUP001", name: "Supplier One" },
        { id: "SUP002", name: "Supplier Two" },
      ]);
      expect(mockDbClient.query).toHaveBeenCalledWith(expect.any(String), ["LA001"]);
      expect(mockDbClient.query).toHaveBeenCalledTimes(1);

      const sql = mockDbClient.query.mock.calls[0][0] as string;
      const expectedSql = `
         SELECT s.supplier_id,
           s.supplier_name
         FROM supplier s
           JOIN la_supplier_offering o
                ON s.supplier_id = o.supplier_id
         WHERE o.la_code = $1;
            `;
      expect(normalizeSql(sql)).toBe(normalizeSql(expectedSql));
    });

    it("should return empty array when no suppliers are found for LA code", async () => {
      mockDbClient.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await supplierService.getSuppliersByLaCode("LA999");

      expect(result).toEqual([]);
      expect(mockDbClient.query).toHaveBeenCalledTimes(1);
    });

    it("should throw error when fetching suppliers by LA code fails", async () => {
      mockDbClient.query.mockRejectedValue(new Error("DB failure"));

      await expect(supplierService.getSuppliersByLaCode("LA001")).rejects.toThrow(
        "Failed to fetch suppliers for laCode LA001",
      );
      expect(mockDbClient.query).toHaveBeenCalledTimes(1);
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
            results_path: "/results",
          },
        ],
        rowCount: 1,
      });

      const result = await supplierService.getSupplierConfigBySupplierId("SUP001");

      expect(result).toEqual({
        serviceUrl: "https://supplier.example.com",
        clientSecretName: "secret-name",
        clientId: "client-id",
        oauthTokenPath: "/oauth/token",
        orderPath: "/orders",
        oauthScope: "scope-value",
        resultsPath: "/results",
      });
      expect(mockDbClient.query).toHaveBeenCalledWith(expect.any(String), ["SUP001"]);
      expect(mockDbClient.query).toHaveBeenCalledTimes(1);

      const sql = mockDbClient.query.mock.calls[0][0] as string;
      const expectedSql = `
        SELECT service_url,
              client_secret_name,
              client_id,
              oauth_token_path,
              oauth_scope,
              order_path,
              results_path
        FROM supplier
        WHERE supplier_id = $1::uuid
        LIMIT 1;
      `;
      expect(normalizeSql(sql)).toBe(normalizeSql(expectedSql));
    });

    it("should trim trailing slash from service URL", async () => {
      mockDbClient.query.mockResolvedValue({
        rows: [
          {
            service_url: "https://supplier.example.com/",
            client_secret_name: "secret-name",
            client_id: "client-id",
            oauth_token_path: "/oauth/token",
            order_path: "/orders",
            oauth_scope: "scope-value",
            results_path: "/results",
          },
        ],
        rowCount: 1,
      });

      const result = await supplierService.getSupplierConfigBySupplierId("SUP001");

      expect(result?.serviceUrl).toBe("https://supplier.example.com");
    });

    it("should return null when supplier does not exist", async () => {
      mockDbClient.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await supplierService.getSupplierConfigBySupplierId("SUP999");
      expect(result).toBeNull();
    });

    it("should throw error when database query fails", async () => {
      mockDbClient.query.mockRejectedValue(new Error("DB failure"));

      await expect(supplierService.getSupplierConfigBySupplierId("SUP001")).rejects.toThrow(
        /Failed to fetch supplier config from database/,
      );
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
            results_path: "/results",
          },
        ],
        rowCount: 1,
      });

      await expect(supplierService.getSupplierConfigBySupplierId("SUP001")).rejects.toThrow(
        "Supplier configuration missing service URL for supplierId SUP001",
      );
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
            results_path: "/results",
          },
        ],
        rowCount: 1,
      });

      await expect(supplierService.getSupplierConfigBySupplierId("SUP001")).rejects.toThrow(
        "Supplier configuration missing client ID for supplierId SUP001",
      );
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
            results_path: "/results",
          },
        ],
        rowCount: 1,
      });

      await expect(supplierService.getSupplierConfigBySupplierId("SUP001")).rejects.toThrow(
        "Supplier configuration missing client secret name for supplierId SUP001",
      );
    });
  });
});
