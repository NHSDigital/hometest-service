import {
  OrderRow,
  OrderStatusRow,
<<<<<<< HEAD
  OrderStatusCodes,
=======
>>>>>>> 84f1dcc (feat: add initial implementation)
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

<<<<<<< HEAD
  describe("checkIdempotency", () => {
    it("should detect duplicate updates with same correlation ID", async () => {
      mockQuery.mockResolvedValue({ rows: [{ 1: 1 }], rowCount: 1 });
=======
  describe("getLatestOrderStatus", () => {
    it("should fetch latest status for order", async () => {
      const mockStatus: OrderStatusRow = {
        status_id: "status-123",
        order_uid: "550e8400-e29b-41d4-a716-446655440000",
        order_reference: 100001,
        status_code: "in-progress",
        created_at: "2024-01-15T10:00:00Z",
        correlation_id: "corr-123",
      };

      mockQuery.mockResolvedValue({
        rows: [mockStatus],
        rowCount: 1,
      });

      const result = await service.getLatestOrderStatus(
        "550e8400-e29b-41d4-a716-446655440000",
      );

      expect(result).toEqual(mockStatus);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY"),
        ["550e8400-e29b-41d4-a716-446655440000"],
      );
    });

    it("should return null when no status exists", async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await service.getLatestOrderStatus("order-123");

      expect(result).toBeNull();
    });

    it("should throw error on database failure", async () => {
      mockQuery.mockRejectedValue(new Error("DB connection failed"));

      await expect(service.getLatestOrderStatus("order-123")).rejects.toThrow(
        "Failed to fetch latest order status",
      );
    });
  });

  describe("checkIdempotency", () => {
    it("should detect duplicate updates with same correlation ID", async () => {
      const mockStatus: OrderStatusRow = {
        status_id: "status-123",
        order_uid: "550e8400-e29b-41d4-a716-446655440000",
        order_reference: 100001,
        status_code: "completed",
        created_at: "2024-01-15T10:00:00Z",
        correlation_id: "corr-123",
      };

      mockQuery.mockResolvedValue({
        rows: [mockStatus],
        rowCount: 1,
      });
>>>>>>> 84f1dcc (feat: add initial implementation)

      const result = await service.checkIdempotency(
        "550e8400-e29b-41d4-a716-446655440000",
        "corr-123",
      );

      expect(result.isDuplicate).toBe(true);
<<<<<<< HEAD
=======
      expect(result.lastUpdate).toEqual(mockStatus);
>>>>>>> 84f1dcc (feat: add initial implementation)
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
      expect(result.lastUpdate).toBeUndefined();
    });
<<<<<<< HEAD
=======

    it("should return false if correlation ID is missing or empty", async () => {
      // correlationId undefined
      let result = await service.checkIdempotency("order-123", undefined);

      expect(result.isDuplicate).toBe(false);
      expect(result.lastUpdate).toBeUndefined();

      // correlationId empty string
      result = await service.checkIdempotency("order-123", "");

      expect(result.isDuplicate).toBe(false);
      expect(result.lastUpdate).toBeUndefined();

      // No query should be called for missing/empty ID
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe("isValidBusinessStatus", () => {
    it("should accept DISPATCHED status", () => {
      expect(service.isValidBusinessStatus("DISPATCHED")).toBe(true);
    });

    it("should accept RECEIVED status", () => {
      expect(service.isValidBusinessStatus("RECEIVED")).toBe(true);
    });

    it("should reject invalid status", () => {
      expect(service.isValidBusinessStatus("INVALID")).toBe(false);
    });

    it("should accept undefined status (optional)", () => {
      expect(service.isValidBusinessStatus(undefined)).toBe(true);
    });

    it("should treat empty string as optional (falsy value)", () => {
      expect(service.isValidBusinessStatus("")).toBe(true);
    });
>>>>>>> 84f1dcc (feat: add initial implementation)
  });

  describe("updateOrderStatus", () => {
    it("should insert new order status record", async () => {
      const mockNewStatus: OrderStatusRow = {
        status_id: "status-456",
        order_uid: "550e8400-e29b-41d4-a716-446655440000",
        order_reference: 100001,
<<<<<<< HEAD
        status_code: OrderStatusCodes.COMPLETE,
=======
        status_code: "completed",
>>>>>>> 84f1dcc (feat: add initial implementation)
        created_at: "2024-01-15T11:00:00Z",
        correlation_id: "corr-123",
      };

      mockQuery.mockResolvedValue({
        rows: [mockNewStatus],
        rowCount: 1,
      });

      const result = await service.updateOrderStatus({
        orderId: "550e8400-e29b-41d4-a716-446655440000",
<<<<<<< HEAD
        orderReference: 100001,
        statusCode: OrderStatusCodes.COMPLETE,
=======
        statusCode: "completed",
<<<<<<< HEAD
        businessStatus: "DISPATCHED",
>>>>>>> 84f1dcc (feat: add initial implementation)
=======
>>>>>>> cf72cd6 (chore: remove storage of business status)
        createdAt: "2024-01-15T11:00:00Z",
        correlationId: "corr-123",
      });

      expect(result).toEqual(mockNewStatus);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO"),
        [
          "550e8400-e29b-41d4-a716-446655440000",
<<<<<<< HEAD
          100001,
          OrderStatusCodes.COMPLETE,
          "2024-01-15T11:00:00Z",
=======
          "completed",
          "2024-01-15T11:00:00Z",
<<<<<<< HEAD
          "DISPATCHED",
>>>>>>> 84f1dcc (feat: add initial implementation)
=======
>>>>>>> cf72cd6 (chore: remove storage of business status)
          "corr-123",
        ],
      );
    });

<<<<<<< HEAD
=======
    it("should insert status without business status", async () => {
      mockQuery.mockResolvedValue({
        rows: [{ status_id: "status-456" }],
        rowCount: 1,
      });

      await service.updateOrderStatus({
        orderId: "order-123",
        statusCode: "in-progress",
        createdAt: "2024-01-15T11:00:00Z",
        correlationId: "corr-123",
      } satisfies OrderStatusUpdateParams);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          "order-123",
          "in-progress",
          "2024-01-15T11:00:00Z",
          "corr-123",
        ]),
      );
    });

>>>>>>> 84f1dcc (feat: add initial implementation)
    it("should throw error on database failure", async () => {
      mockQuery.mockRejectedValue(new Error("DB connection failed"));

      await expect(
        service.updateOrderStatus({
          orderId: "order-123",
<<<<<<< HEAD
          statusCode: OrderStatusCodes.COMPLETE,
=======
          statusCode: "completed",
>>>>>>> 84f1dcc (feat: add initial implementation)
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
<<<<<<< HEAD
          statusCode: OrderStatusCodes.COMPLETE,
=======
          statusCode: "completed",
>>>>>>> 84f1dcc (feat: add initial implementation)
          createdAt: "2024-01-15T11:00:00Z",
          correlationId: "corr-123",
        } satisfies OrderStatusUpdateParams),
      ).rejects.toThrow("Failed to update order status");
    });
  });
<<<<<<< HEAD
=======

  describe("extractIdFromReference", () => {
    it("should extract UUID from ServiceRequest reference", () => {
      const result = service.extractIdFromReference(
        "ServiceRequest/550e8400-e29b-41d4-a716-446655440000",
      );

      expect(result).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should extract UUID from Patient reference", () => {
      const result = service.extractIdFromReference("Patient/patient-uuid-123");

      expect(result).toBe("patient-uuid-123");
    });

    it("should return null for invalid reference format", () => {
      const result = service.extractIdFromReference("invalid-reference");

      expect(result).toBeNull();
    });

    it("should return null for reference with more than 2 parts", () => {
      const result = service.extractIdFromReference("Resource/Type/Id");

      expect(result).toBeNull();
    });

    it("should return null for reference with only resource type", () => {
      const result = service.extractIdFromReference("ServiceRequest/");

      expect(result).toBe("");
    });
  });
>>>>>>> 84f1dcc (feat: add initial implementation)
});
