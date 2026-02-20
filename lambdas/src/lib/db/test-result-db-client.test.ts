import { TestResultDbClient, type TestResult } from "./test-result-db-client";
import { type DBClient } from "./db-client";

describe("TestResultDbClient", () => {
  let testResultDbClient: TestResultDbClient;
  let mockDbClient: jest.Mocked<DBClient>;

  beforeEach(() => {
    mockDbClient = {
      query: jest.fn(),
      close: jest.fn(),
    };

    testResultDbClient = new TestResultDbClient(mockDbClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getResult", () => {
    const orderId = "550e8400-e29b-41d4-a716-446655440000";
    const nhsNumber = "9876543210";
    const dateOfBirth = new Date("1990-05-15");

    it("should return test result when found", async () => {
      const mockTestResult: TestResult = {
        id: "result-123",
        status: "RESULT_AVAILABLE",
        created_at: new Date("2026-02-20T10:30:00Z"),
        order_id: orderId,
        test_code: "31676001",
        test_description: "HIV antigen test",
        supplier_id: "SUP001",
        supplier_name: "Test Supplier Ltd",
        patient_id: "patient-456",
      };

      mockDbClient.query.mockResolvedValue({
        rows: [mockTestResult],
        rowCount: 1,
      });

      const result = await testResultDbClient.getResult(
        orderId,
        nhsNumber,
        dateOfBirth,
      );

      expect(result).toEqual(mockTestResult);
      expect(mockDbClient.query).toHaveBeenCalledWith(expect.any(String), [
        orderId,
        nhsNumber,
        dateOfBirth,
      ]);
    });

    it("should return null when test result not found", async () => {
      mockDbClient.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await testResultDbClient.getResult(
        orderId,
        nhsNumber,
        dateOfBirth,
      );

      expect(result).toBeNull();
      expect(mockDbClient.query).toHaveBeenCalledWith(expect.any(String), [
        orderId,
        nhsNumber,
        dateOfBirth,
      ]);
    });

    it("should return test result with RESULT_WITHHELD status", async () => {
      const mockTestResult: TestResult = {
        id: "result-789",
        status: "RESULT_WITHHELD",
        created_at: new Date("2026-02-20T15:45:00Z"),
        order_id: orderId,
        test_code: "31676001",
        test_description: "HIV antigen test",
        supplier_id: "SUP002",
        supplier_name: "Another Supplier Ltd",
        patient_id: "patient-999",
      };

      mockDbClient.query.mockResolvedValue({
        rows: [mockTestResult],
        rowCount: 1,
      });

      const result = await testResultDbClient.getResult(
        orderId,
        nhsNumber,
        dateOfBirth,
      );

      expect(result).toEqual(mockTestResult);
      expect(result?.status).toBe("RESULT_WITHHELD");
    });

    it("should execute correct SQL query with all required elements", async () => {
      mockDbClient.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await testResultDbClient.getResult(orderId, nhsNumber, dateOfBirth);

      const expectedQuery = `SELECT
          rs.result_id AS id,
          rs.status as status,
          rs.created_at AS created_at,
          o.order_uid AS order_id,
          tt.description AS procedure_description,
          os.status_code AS status_code,
          s.supplier_id AS supplier_id,
          s.supplier_name AS supplier_name,
          p.patient_uid AS patient_id
      FROM hometest.test_order o
      INNER JOIN test_type tt ON tt.test_code = o.test_code
      INNER JOIN hometest.patient_mapping p ON p.patient_uid = o.patient_uid
      INNER JOIN hometest.supplier s ON s.supplier_id = o.supplier_id
      INNER JOIN hometest.result_status rs ON o.order_uid = o.order_uid
      WHERE
          (
            SELECT os.status_code = 'COMPLETE'
            FROM hometest.order_status os
            WHERE os.order_uid = $1
            ORDER BY os.created_at DESC
            LIMIT 1
          ) AND
          o.order_uid = $1 AND
          p.nhs_number = $2 AND
          p.birth_date = $3::date
      ORDER BY rs.created_at DESC
      LIMIT 1;`;

      const actualQuery = mockDbClient.query.mock.calls[0][0];

      // Normalize whitespace for comparison
      const normalizeQuery = (query: string) =>
        query.replace(/\s+/g, " ").trim();

      expect(normalizeQuery(actualQuery)).toBe(normalizeQuery(expectedQuery));
      expect(mockDbClient.query).toHaveBeenCalledWith(expect.any(String), [
        orderId,
        nhsNumber,
        dateOfBirth,
      ]);
    });

    it("should call query with correct parameter types", async () => {
      mockDbClient.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await testResultDbClient.getResult(orderId, nhsNumber, dateOfBirth);

      expect(mockDbClient.query).toHaveBeenCalledTimes(1);
      const [query, params] = mockDbClient.query.mock.calls[0];

      expect(typeof query).toBe("string");
      expect(Array.isArray(params)).toBe(true);
      expect(params).toHaveLength(3);
      expect(typeof params![0]).toBe("string"); // orderId
      expect(typeof params![1]).toBe("string"); // nhsNumber
      expect(params![2]).toBeInstanceOf(Date); // dateOfBirth
    });

    it("should throw error when database query fails", async () => {
      const dbError = new Error("Database connection failed");
      mockDbClient.query.mockRejectedValue(dbError);

      await expect(
        testResultDbClient.getResult(orderId, nhsNumber, dateOfBirth),
      ).rejects.toThrow("Database connection failed");
    });
  });
});
