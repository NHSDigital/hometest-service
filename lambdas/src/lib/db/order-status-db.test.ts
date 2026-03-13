import { DbResult } from "./db-client";
import { OrderStatusCodes, OrderStatusService } from "./order-status-db";
import { OrderStatusMutator } from "./types/__generated__/hometest/OrderStatus";
import TestOrder from "./types/__generated__/hometest/TestOrder";

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

  describe("getPatientIdFromOrder", () => {
    it("should fetch order by UUID", async () => {
      const expectedQueryResponse: DbResult<{
        patient_uid: TestOrder["patientUid"];
      }> = {
        rows: [{ patient_uid: "mocked-patient-uid" }],
        rowCount: 1,
      };

      mockQuery.mockResolvedValue(expectedQueryResponse);

      const result = await service.getPatientIdFromOrder("some-mocked-order-id");

      expect(result).toEqual(expectedQueryResponse.rows[0].patient_uid);
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
      const mockParams: OrderStatusMutator = {
        orderUid: "some-mocked-order-id",
        statusCode: OrderStatusCodes.COMPLETE,
        createdAt: new Date("2024-01-15T11:00:00Z"),
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
          mockParams.orderUid,
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
          orderUid: "some-mocked-order-id",
          statusCode: OrderStatusCodes.COMPLETE,
          createdAt: new Date("2024-01-15T11:00:00Z"),
          correlationId: "some-mocked-correlation-id",
        } satisfies OrderStatusMutator),
      ).rejects.toThrow("Failed to update order status");
    });

    it("should throw error if no rows returned", async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await expect(
        service.addOrderStatusUpdate({
          orderUid: "some-mocked-order-id",
          statusCode: OrderStatusCodes.COMPLETE,
          createdAt: new Date("2024-01-15T11:00:00Z"),
          correlationId: "some-mocked-correlation-id",
        } satisfies OrderStatusMutator),
      ).rejects.toThrow("Failed to update order status");
    });
  });
});
