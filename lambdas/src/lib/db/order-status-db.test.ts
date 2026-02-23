import {
  OrderRow,
  OrderStatusRow,
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
    const mockDbClient = {
      query: mockQuery,
      close: jest.fn(),
    };
    service = new OrderStatusService(mockDbClient as any);
  });

  describe("getOrder", () => {
    it("should fetch order by UUID", async () => {
      const mockOrder: OrderRow = {
        order_uid: "550e8400-e29b-41d4-a716-446655440000",
        patient_uid: "patient-123",
        order_reference: 100001,
        supplier_id: "supplier-123",
        test_code: "TEST001",
        created_at: "2024-01-01T00:00:00Z",
      };

      mockQuery.mockResolvedValue({
        rows: [mockOrder],
        rowCount: 1,
      });

      const result = await service.getOrder(
        "550e8400-e29b-41d4-a716-446655440000",
      );

      expect(result).toEqual(mockOrder);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"), // TODO: Look into this type of assertion
        ["550e8400-e29b-41d4-a716-446655440000"],
      );
    });

    it("should return null when order does not exist", async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await service.getOrder("nonexistent-id");

      expect(result).toBeNull();
    });

    it("should throw error on database failure", async () => {
      mockQuery.mockRejectedValue(new Error("DB connection failed"));

      await expect(service.getOrder("order-123")).rejects.toThrow(
        "Failed to fetch order from database",
      );
    });
  });

  describe("checkIdempotency", () => {
    it("should detect duplicate updates with same correlation ID", async () => {
      mockQuery.mockResolvedValue({ rows: [{ 1: 1 }], rowCount: 1 });

      const result = await service.checkIdempotency(
        "550e8400-e29b-41d4-a716-446655440000",
        "corr-123",
      );

      expect(result.isDuplicate).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("correlation_id"),
        ["550e8400-e29b-41d4-a716-446655440000", "corr-123"],
      );
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

  describe("updateOrderStatus", () => {
    it("should insert new order status record", async () => {
      const mockNewStatus: OrderStatusRow = {
        status_id: "status-456",
        order_uid: "550e8400-e29b-41d4-a716-446655440000",
        order_reference: 100001,
        status_code: OrderStatusCodes.COMPLETE,
        created_at: "2024-01-15T11:00:00Z",
        correlation_id: "corr-123",
      };

      mockQuery.mockResolvedValue({
        rows: [mockNewStatus],
        rowCount: 1,
      });

      const result = await service.updateOrderStatus({
        orderId: "550e8400-e29b-41d4-a716-446655440000",
        statusCode: OrderStatusCodes.COMPLETE,
        createdAt: "2024-01-15T11:00:00Z",
        correlationId: "corr-123",
      });

      expect(result).toEqual(mockNewStatus);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO"),
        [
          "550e8400-e29b-41d4-a716-446655440000",
          OrderStatusCodes.COMPLETE,
          "2024-01-15T11:00:00Z",
          "corr-123",
        ],
      );
    });

    it("should throw error on database failure", async () => {
      mockQuery.mockRejectedValue(new Error("DB connection failed"));

      await expect(
        service.updateOrderStatus({
          orderId: "order-123",
          statusCode: OrderStatusCodes.COMPLETE,
          createdAt: "2024-01-15T11:00:00Z",
          correlationId: "corr-123",
        } satisfies OrderStatusUpdateParams),
      ).rejects.toThrow("Failed to update order status");
    });

    it("should throw error if no rows returned", async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await expect(
        service.updateOrderStatus({
          orderId: "order-123",
          statusCode: OrderStatusCodes.COMPLETE,
          createdAt: "2024-01-15T11:00:00Z",
          correlationId: "corr-123",
        } satisfies OrderStatusUpdateParams),
      ).rejects.toThrow("Failed to update order status");
    });
  });
});
