import { DBClient } from "./db-client";
import {
  NotificationAuditEntryParams,
  NotifyRecipientData,
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

  describe("getNotifyRecipientData", () => {
    it("should return notify recipient data", async () => {
      const mockRecipientRow = {
        nhs_number: "1234567890",
        birth_date: "1990-04-20",
      };

      mockQuery.mockResolvedValue({
        rows: [mockRecipientRow],
        rowCount: 1,
      });

      const result = await service.getNotifyRecipientData("some-mocked-patient-id");

      expect(result).toEqual({
        nhsNumber: mockRecipientRow.nhs_number,
        dateOfBirth: mockRecipientRow.birth_date,
      } satisfies NotifyRecipientData);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("patient_mapping"), [
        "some-mocked-patient-id",
      ]);
    });

    it("should throw when patient record does not exist", async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await expect(service.getNotifyRecipientData("missing-patient-id")).rejects.toThrow(
        "Failed to fetch notify recipient data",
      );
    });
  });

  describe("isFirstStatusOccurrence", () => {
    it("should return true for first occurrence", async () => {
      mockQuery.mockResolvedValue({
        rows: [{ count: 1 }],
        rowCount: 1,
      });

      const result = await service.isFirstStatusOccurrence(
        "some-mocked-order-id",
        OrderStatusCodes.DISPATCHED,
      );

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("COUNT(*)::int"), [
        "some-mocked-order-id",
        OrderStatusCodes.DISPATCHED,
      ]);
    });

    it("should return false when status already exists", async () => {
      mockQuery.mockResolvedValue({
        rows: [{ count: 2 }],
        rowCount: 1,
      });

      const result = await service.isFirstStatusOccurrence(
        "some-mocked-order-id",
        OrderStatusCodes.DISPATCHED,
      );

      expect(result).toBe(false);
    });
  });

  describe("insertNotificationAuditEntry", () => {
    it("should insert notification audit entry", async () => {
      const params: NotificationAuditEntryParams = {
        messageReference: "123e4567-e89b-12d3-a456-426614174000",
        eventCode: "ORDER_DISPATCHED",
        correlationId: "123e4567-e89b-12d3-a456-426614174001",
        status: "SENT",
      };

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 1,
      });

      await expect(service.insertNotificationAuditEntry(params)).resolves.toBeUndefined();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("notification_audit"), [
        params.messageReference,
        null,
        params.eventCode,
        null,
        params.correlationId,
        params.status,
      ]);
    });

    it("should throw when notification audit insert affects no rows", async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await expect(
        service.insertNotificationAuditEntry({
          messageReference: "123e4567-e89b-12d3-a456-426614174000",
          eventCode: "ORDER_DISPATCHED",
          correlationId: "123e4567-e89b-12d3-a456-426614174001",
          status: "SENT",
        } satisfies NotificationAuditEntryParams),
      ).rejects.toThrow("Failed to insert notification audit entry");
    });
  });
});
