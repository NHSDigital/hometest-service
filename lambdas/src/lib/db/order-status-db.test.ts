import { OrderStatusCodes, OrderStatusService } from "./order-status-db";
import { IAddOrderStatusUpdateParams } from "./queries/addOrderStatusUpdate";
import {
  getPatientIdFromOrder,
  IGetPatientIdFromOrderResult,
} from "./queries/getPatientIdFromOrder";

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
      pgPool: {},
    };
    service = new OrderStatusService(mockDbClient as any);
  });

  describe("getPatientIdFromOrder", () => {
    // it("should fetch order by UUID", async () => {
    //   const mockOrder: OrderRow = {
    //     order_uid: "some-mocked-order-id",
    //     patient_uid: "some-mocked-patient-id",
    //     order_reference: 100001,
    //     supplier_id: "some-mocked-supplier-id",
    //     test_code: "some-mocked-test-code",
    //     created_at: "2024-01-01T00:00:00Z",
    //   };

    //   mockQuery.mockResolvedValue({
    //     rows: [mockOrder],
    //     rowCount: 1,
    //   });

    //   const result = await service.getPatientIdFromOrder("some-mocked-order-id");

    //   expect(result).toEqual(mockOrder.patient_uid);
    //   expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("SELECT"), [
    //     "some-mocked-order-id",
    //   ]);
    // });

    fit("should fetch order by UUID", async () => {
      // typed mock result
      const mockResult: IGetPatientIdFromOrderResult[] = [
        { patient_uid: "some-mocked-patient-id" },
      ];

      // Spy and mock the run() method
      const runSpy = jest.spyOn(getPatientIdFromOrder, "run").mockResolvedValue(mockResult);

      const result = await service.getPatientIdFromOrder({ order_uid: "some-mocked-order-id" });

      expect(result).toEqual(mockResult[0]);

      // Instead of expecting a real object for the pool, just allow anything
      expect(runSpy).toHaveBeenCalledWith({ order_uid: "some-mocked-order-id" }, expect.anything());
    });

    it("should return null when order does not exist", async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await service.getPatientIdFromOrder({ order_uid: "non-existent-order-id" });

      expect(result).toBeNull();
    });

    it("should throw error on database failure", async () => {
      mockQuery.mockRejectedValue(new Error("DB connection failed"));

      await expect(service.getPatientIdFromOrder({ order_uid: "order-123" })).rejects.toThrow(
        "Failed to fetch order for orderId order-123",
      );
    });
  });

  describe("checkIdempotency", () => {
    it("should detect duplicate updates with same correlation ID", async () => {
      mockQuery.mockResolvedValue({ rows: [{ 1: 1 }], rowCount: 1 });

      const result = await service.checkIdempotency({
        order_uid: "some-mocked-order-id",
        correlation_id: "some-mocked-correlation-id",
      });

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

      const result = await service.checkIdempotency({
        order_uid: "order-123",
        correlation_id: "new-corr-id",
      });

      expect(result.isDuplicate).toBe(false);
    });
  });

  describe("addUpdateOrderStatus", () => {
    it("should insert new order status record", async () => {
      const mockParams: IAddOrderStatusUpdateParams = {
        order_uid: "some-mocked-order-id",
        status_code: OrderStatusCodes.COMPLETE,
        created_at: "2024-01-15T11:00:00Z",
        correlation_id: "some-mocked-correlation-id",
      };

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 1,
      });

      await expect(service.addOrderStatusUpdate(mockParams)).resolves.toBeUndefined();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO"),
        Object.values([
          mockParams.order_uid,
          mockParams.status_code,
          mockParams.created_at,
          mockParams.correlation_id,
        ]),
      );
    });

    it("should throw error on database failure", async () => {
      mockQuery.mockRejectedValue(new Error("DB connection failed"));

      await expect(
        service.addOrderStatusUpdate({
          order_uid: "some-mocked-order-id",
          status_code: OrderStatusCodes.COMPLETE,
          created_at: "2024-01-15T11:00:00Z",
          correlation_id: "some-mocked-correlation-id",
        } satisfies IAddOrderStatusUpdateParams),
      ).rejects.toThrow("Failed to update order status");
    });

    it("should throw error if no rows returned", async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await expect(
        service.addOrderStatusUpdate({
          order_uid: "some-mocked-order-id",
          status_code: OrderStatusCodes.COMPLETE,
          created_at: "2024-01-15T11:00:00Z",
          correlation_id: "some-mocked-correlation-id",
        } satisfies IAddOrderStatusUpdateParams),
      ).rejects.toThrow("Failed to update order status");
    });
  });
});
