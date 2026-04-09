import { DBClient } from "./db-client";
import {
  OrderRow,
  OrderStatusCodes,
  OrderStatusService,
  OrderStatusUpdateParams,
} from "./order-status-db";

const mockQuery = jest.fn();

jest.mock("./db-client", () => ({
  PostgresDbClient: jest.fn().mockImplementation(() => ({
    query: mockQuery,
  })),
}));

describe("OrderStatusService", () => {
  let service: OrderStatusService;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockDbClient: DBClient = {
      query: mockQuery,
      close: jest.fn().mockResolvedValue(undefined),
      withTransaction: jest.fn(),
    };
    service = new OrderStatusService(mockDbClient);
  });

  describe("getPatientIdFromOrder", () => {
    it("should fetch order by UUID", async () => {
      const mockOrder: OrderRow = {
        order_uid: "some-mocked-order-id",
        patient_uid: "some-mocked-patient-id",
        order_reference: 100001,
        supplier_id: "some-mocked-supplier-id",
        test_code: "some-mocked-test-code",
        created_at: "2024-01-01T00:00:00Z",
      };

      mockQuery.mockResolvedValue({
        rows: [mockOrder],
        rowCount: 1,
      });

      const result = await service.getPatientIdFromOrder("some-mocked-order-id");

      expect(result).toEqual(mockOrder.patient_uid);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("SELECT"), [
        "some-mocked-order-id",
      ]);
    });

    it("should return null when order does not exist", async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await service.getPatientIdFromOrder("nonexistent-id");

      expect(result).toBeNull();
    });

    it("should throw error on database failure", async () => {
      mockQuery.mockRejectedValue(new Error("DB connection failed"));

      await expect(service.getPatientIdFromOrder("order-123")).rejects.toThrow(
        "Failed to fetch order from database",
      );
    });
  });

  describe("checkIdempotency", () => {
    it("should detect duplicate updates with same correlation ID", async () => {
      mockQuery.mockResolvedValue({ rows: [{ 1: 1 }], rowCount: 1 });

      const result = await service.checkIdempotency(
        "some-mocked-order-id",
        "some-mocked-correlation-id",
      );

      expect(result.isDuplicate).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("correlation_id"), [
        "some-mocked-order-id",
        "some-mocked-correlation-id",
      ]);
    });

    it("should return false for new correlation IDs", async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await service.checkIdempotency("order-123", "new-corr-id");

      expect(result.isDuplicate).toBe(false);
    });
  });

  describe("addUpdateOrderStatus", () => {
    it("should insert new order status record", async () => {
      const mockParams: OrderStatusUpdateParams = {
        orderId: "some-mocked-order-id",
        statusCode: OrderStatusCodes.COMPLETE,
        createdAt: "2024-01-15T11:00:00Z",
        correlationId: "some-mocked-correlation-id",
      };

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 1,
      });

      await expect(service.addOrderStatusUpdate(mockParams)).resolves.toBeUndefined();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO"),
        Object.values([
          mockParams.orderId,
          mockParams.statusCode,
          mockParams.createdAt,
          mockParams.correlationId,
        ]),
      );
    });

    it("should throw error on database failure", async () => {
      mockQuery.mockRejectedValue(new Error("DB connection failed"));

      await expect(
        service.addOrderStatusUpdate({
          orderId: "some-mocked-order-id",
          statusCode: OrderStatusCodes.COMPLETE,
          createdAt: "2024-01-15T11:00:00Z",
          correlationId: "some-mocked-correlation-id",
        } satisfies OrderStatusUpdateParams),
      ).rejects.toThrow("Failed to update order status");
    });

    it("should throw error if no rows returned", async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await expect(
        service.addOrderStatusUpdate({
          orderId: "some-mocked-order-id",
          statusCode: OrderStatusCodes.COMPLETE,
          createdAt: "2024-01-15T11:00:00Z",
          correlationId: "some-mocked-correlation-id",
        } satisfies OrderStatusUpdateParams),
      ).rejects.toThrow("Failed to update order status");
    });
  });

  describe("getOrderStatusCreatedAt", () => {
    it("should return the created_at timestamp for order status", async () => {
      mockQuery.mockResolvedValue({
        rows: [{ created_at: "2024-01-15T10:00:00Z" }],
        rowCount: 1,
      });

      const result = await service.getOrderStatusCreatedAt(
        "some-mocked-order-id",
        OrderStatusCodes.DISPATCHED,
      );

      expect(result).toBe("2024-01-15T10:00:00Z");
      expect(mockQuery).toHaveBeenCalledWith(
        `
      SELECT created_at
      FROM order_status
      WHERE order_uid = $1::uuid AND status_code = $2
      ORDER BY created_at DESC
      LIMIT 1;
    `,
        ["some-mocked-order-id", OrderStatusCodes.DISPATCHED],
      );
    });

    it("should throw error when status has not been recorded", async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await expect(
        service.getOrderStatusCreatedAt("some-mocked-order-id", OrderStatusCodes.DISPATCHED),
      ).rejects.toThrow("Failed to retrieve order status created_at");
    });

    it("should throw error on database failure", async () => {
      mockQuery.mockRejectedValue(new Error("DB connection failed"));

      await expect(
        service.getOrderStatusCreatedAt("some-mocked-order-id", OrderStatusCodes.DISPATCHED),
      ).rejects.toThrow("Failed to retrieve order status created_at");
    });
  });
});
