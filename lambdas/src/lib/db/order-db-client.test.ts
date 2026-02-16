import { OrderDbClient, type Order } from "./order-db-client";
import { type DBClient } from "./db-client";

describe("OrderDbClient", () => {
  let orderDbClient: OrderDbClient;
  let mockDbClient: jest.Mocked<DBClient>;

  beforeEach(() => {
    mockDbClient = {
      query: jest.fn(),
      close: jest.fn(),
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
      expect(mockDbClient.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        [orderId, nhsNumber, dateOfBirth],
      );
      expect(mockDbClient.query).toHaveBeenCalledWith(
        expect.stringContaining("FROM hometest.test_order o"),
        expect.any(Array),
      );
      expect(mockDbClient.query).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY os.created_at DESC"),
        expect.any(Array),
      );
      expect(mockDbClient.query).toHaveBeenCalledWith(
        expect.stringContaining("LIMIT 1"),
        expect.any(Array),
      );
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

    it("should return null when rowCount is null", async () => {
      mockDbClient.query.mockResolvedValue({
        rows: [],
        rowCount: null,
      });

      const result = await orderDbClient.getOrder(
        orderId,
        nhsNumber,
        dateOfBirth,
      );

      expect(result).toBeNull();
    });

    it("should use correct query parameters", async () => {
      const customOrderId = "custom-order-id";
      const customNhsNumber = "1234567890";
      const customDateOfBirth = new Date("1985-12-25");

      mockDbClient.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await orderDbClient.getOrder(
        customOrderId,
        customNhsNumber,
        customDateOfBirth,
      );

      expect(mockDbClient.query).toHaveBeenCalledWith(expect.any(String), [
        customOrderId,
        customNhsNumber,
        customDateOfBirth,
      ]);
    });

    it("should include all required joins in query", async () => {
      mockDbClient.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await orderDbClient.getOrder(orderId, nhsNumber, dateOfBirth);

      const queryCall = mockDbClient.query.mock.calls[0][0];
      expect(queryCall).toContain("INNER JOIN hometest.order_status os");
      expect(queryCall).toContain("INNER JOIN hometest.status_type st");
      expect(queryCall).toContain("INNER JOIN hometest.patient_mapping p");
      expect(queryCall).toContain("INNER JOIN hometest.supplier s");
    });

    it("should include all required columns in SELECT", async () => {
      mockDbClient.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await orderDbClient.getOrder(orderId, nhsNumber, dateOfBirth);

      const queryCall = mockDbClient.query.mock.calls[0][0];
      expect(queryCall).toContain("o.order_uid AS id");
      expect(queryCall).toContain("o.order_reference AS reference_number");
      expect(queryCall).toContain("o.created_at AS created_at");
      expect(queryCall).toContain("os.status_code AS status_code");
      expect(queryCall).toContain("st.description AS status_description");
      expect(queryCall).toContain("os.created_at AS status_created_at");
      expect(queryCall).toContain("s.supplier_id AS supplier_id");
      expect(queryCall).toContain("s.supplier_name AS supplier_name");
      expect(queryCall).toContain("p.nhs_number AS patient_nhs_number");
      expect(queryCall).toContain("p.birth_date AS patient_birth_date");
    });

    it("should include WHERE clause with all conditions", async () => {
      mockDbClient.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await orderDbClient.getOrder(orderId, nhsNumber, dateOfBirth);

      const queryCall = mockDbClient.query.mock.calls[0][0];
      expect(queryCall).toContain("WHERE o.order_uid = $1");
      expect(queryCall).toContain("p.nhs_number = $2");
      expect(queryCall).toContain("p.birth_date = $3::date");
    });

    it("should throw error when database query fails", async () => {
      const dbError = new Error("Database connection failed");
      mockDbClient.query.mockRejectedValue(dbError);

      await expect(
        orderDbClient.getOrder(orderId, nhsNumber, dateOfBirth),
      ).rejects.toThrow("Database connection failed");
    });

    it("should return most recent order status", async () => {
      const mockOrder: Order = {
        id: orderId,
        reference_number: 12345,
        created_at: new Date("2026-02-15T10:30:00Z"),
        status_code: "RECEIVED",
        status_description: "RECEIVED in lab",
        status_created_at: new Date("2026-02-16T14:30:00Z"),
        supplier_id: "SUP002",
        supplier_name: "Another Supplier",
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
      expect(result?.status_code).toBe("RECEIVED");
      expect(result?.status_description).toBe("RECEIVED in lab");
    });
  });
});
