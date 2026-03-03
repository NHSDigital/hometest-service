import { OrderDbClient, type Order } from "./order-db-client";
import { type DBClient } from "./db-client";

describe("OrderDbClient", () => {
  let orderDbClient: OrderDbClient;
  let mockDbClient: jest.Mocked<DBClient>;

  beforeEach(() => {
    mockDbClient = {
      query: jest.fn(),
      close: jest.fn(),
      withTransaction: jest.fn(),
    };

    orderDbClient = new OrderDbClient(mockDbClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getOrder", () => {
    const orderId = "550e8400-e29b-41d4-a716-446655440000";
    const nhsNumber = "9876543210";
    const dateOfBirth = new Date("1990-05-15");

    it("should return order when found", async () => {
      const mockOrder: Order = {
        id: orderId,
        reference_number: 12345,
        created_at: new Date("2026-02-15T10:30:00Z"),
        test_code: "31676001",
        test_description: "HIV antigen test",
        status_code: "DISPATCHED",
        status_description: "DISPATCHED",
        status_created_at: new Date("2026-02-16T08:00:00Z"),
        supplier_id: "SUP001",
        supplier_name: "Test Supplier Ltd",
        patient_nhs_number: nhsNumber,
        patient_birth_date: dateOfBirth,
      };

      mockDbClient.query.mockResolvedValue({
        rows: [mockOrder],
        rowCount: 1,
      });

      const result = await orderDbClient.getOrder(
        orderId,
        nhsNumber,
        dateOfBirth,
      );

      expect(result).toEqual(mockOrder);
      expect(mockDbClient.query).toHaveBeenCalledWith(expect.any(String), [
        orderId,
        nhsNumber,
        dateOfBirth,
      ]);
    });

    it("should return null when order not found", async () => {
      mockDbClient.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await orderDbClient.getOrder(
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

    it("should execute correct SQL query with all required elements", async () => {
      mockDbClient.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await orderDbClient.getOrder(orderId, nhsNumber, dateOfBirth);

      const expectedQuery = `SELECT
          o.order_uid AS id,
          o.order_reference AS reference_number,
          o.created_at AS created_at,
          o.test_code AS test_code,
          tt.description AS test_description,
          os.status_code AS status_code,
          st.description AS status_description,
          os.created_at AS status_created_at,
          s.supplier_id AS supplier_id,
          s.supplier_name AS supplier_name,
          p.nhs_number AS patient_nhs_number,
          p.birth_date AS patient_birth_date
      FROM test_order o
      INNER JOIN test_type tt ON tt.test_code = o.test_code
      INNER JOIN order_status os ON os.order_uid = o.order_uid
      INNER JOIN status_type st ON st.status_code = os.status_code
      INNER JOIN patient_mapping p ON p.patient_uid = o.patient_uid
      INNER JOIN supplier s ON s.supplier_id = o.supplier_id
      WHERE o.order_uid = $1::uuid AND p.nhs_number = $2 AND p.birth_date = $3::date
      ORDER BY os.created_at DESC
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

    it("should throw error when database query fails", async () => {
      const dbError = new Error("Database connection failed");
      mockDbClient.query.mockRejectedValue(dbError);

      await expect(
        orderDbClient.getOrder(orderId, nhsNumber, dateOfBirth),
      ).rejects.toThrow("Database connection failed");
    });
  });
});
