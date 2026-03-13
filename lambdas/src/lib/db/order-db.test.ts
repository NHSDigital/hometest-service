import { OrderResultSummary, OrderService } from "./order-db";
import { OrderStatus, ResultStatus } from "../types/status";

import { Commons } from "../commons";

const normalizeWhitespace = (sql: string): string => sql.replace(/\s+/g, " ").trim();

describe("OrderService", () => {
  let dbClient: any;
  let commons: Pick<Commons, "logError">;
  let orderService: OrderService;

  beforeEach(() => {
    dbClient = {
      query: jest.fn(),
      withTransaction: jest.fn(),
    };
    commons = {
      logError: jest.fn(),
    };
    orderService = new OrderService(dbClient, commons as any as Commons);
  });

  describe("retrieveOrderDetails", () => {
    const expectedRetrieveOrderDetailsQuery = `
            SELECT
              o.order_uid,
              o.supplier_id,
              o.patient_uid,
              r.status AS result_status,
              r.correlation_id
            FROM test_order o
            LEFT JOIN result_status r ON o.order_uid = r.order_uid
            WHERE o.order_uid = $1::uuid
            ORDER BY r.created_at DESC
            LIMIT 1;
        `;

    it("should return order details when found", async () => {
      const mockSummary: OrderResultSummary = {
        order_uid: "order-123",
        supplier_id: "supplier-789",
        patient_uid: "patient-abc",
        result_status: ResultStatus.Result_Available,
        correlation_id: "corr-xyz",
      };
      dbClient.query.mockResolvedValue({ rows: [mockSummary] });

      const result = await orderService.retrieveOrderDetails("order-123");

      expect(dbClient.query).toHaveBeenCalledTimes(1);
      expect(normalizeWhitespace(dbClient.query.mock.calls[0][0])).toBe(
        normalizeWhitespace(expectedRetrieveOrderDetailsQuery),
      );
      expect(dbClient.query.mock.calls[0][1]).toEqual(["order-123"]);
      expect(result).toEqual(mockSummary);
    });

    it("should return null when no order is found", async () => {
      dbClient.query.mockResolvedValue({ rows: [] });

      const result = await orderService.retrieveOrderDetails("order-404");

      expect(dbClient.query).toHaveBeenCalledTimes(1);
      expect(normalizeWhitespace(dbClient.query.mock.calls[0][0])).toBe(
        normalizeWhitespace(expectedRetrieveOrderDetailsQuery),
      );
      expect(dbClient.query.mock.calls[0][1]).toEqual(["order-404"]);
      expect(result).toBeNull();
    });

    it("should log and rethrow when retrieving order details fails", async () => {
      const error = new Error("query failed");
      dbClient.query.mockRejectedValue(error);

      await expect(orderService.retrieveOrderDetails("order-500")).rejects.toThrow(error);

      expect(dbClient.query).toHaveBeenCalledTimes(1);
      expect(normalizeWhitespace(dbClient.query.mock.calls[0][0])).toBe(
        normalizeWhitespace(expectedRetrieveOrderDetailsQuery),
      );
      expect(dbClient.query.mock.calls[0][1]).toEqual(["order-500"]);
      expect(commons.logError).toHaveBeenCalledWith(
        "order-db",
        "Failed to retrieve order details",
        {
          error,
          orderUid: "order-500",
        },
      );
    });
  });

  describe("updateOrderStatusAndResultStatus", () => {
    it("should execute both SQL statements with the expected full queries and parameters", async () => {
      const tx = {
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
      };
      dbClient.withTransaction.mockImplementation(
        async (callback: (client: typeof tx) => Promise<void>) => callback(tx),
      );

      const expectedOrderStatusQuery = `
          WITH latest AS
            (SELECT status_code
            FROM order_status
            WHERE order_uid = $1::uuid
            ORDER BY created_at DESC
            LIMIT 1)
          INSERT INTO order_status (order_uid, status_code, correlation_id)
          SELECT $1::uuid, $2, $3::uuid
          WHERE NOT EXISTS (SELECT 1 FROM latest WHERE latest.status_code = $2);
          `;
      const expectedResultStatusQuery = `
          INSERT INTO result_status (order_uid, status, correlation_id)
          VALUES ($1::uuid, $2, $3::uuid);`;

      await orderService.updateOrderStatusAndResultStatus(
        "order-1",
        OrderStatus.Complete,
        ResultStatus.Result_Available,
        "corr-1",
      );

      expect(dbClient.withTransaction).toHaveBeenCalledTimes(1);
      expect(dbClient.withTransaction).toHaveBeenCalledWith(expect.any(Function));
      expect(tx.query).toHaveBeenCalledTimes(2);
      expect(normalizeWhitespace(tx.query.mock.calls[0][0])).toBe(
        normalizeWhitespace(expectedOrderStatusQuery),
      );
      expect(tx.query.mock.calls[0][1]).toEqual(["order-1", OrderStatus.Complete, "corr-1"]);
      expect(normalizeWhitespace(tx.query.mock.calls[1][0])).toBe(
        normalizeWhitespace(expectedResultStatusQuery),
      );
      expect(tx.query.mock.calls[1][1]).toEqual([
        "order-1",
        ResultStatus.Result_Available,
        "corr-1",
      ]);
    });

    it("should log and rethrow when the transaction fails", async () => {
      const error = new Error("transaction failed");
      dbClient.withTransaction.mockRejectedValue(error);

      await expect(
        orderService.updateOrderStatusAndResultStatus(
          "order-1",
          OrderStatus.Complete,
          ResultStatus.Result_Available,
          "corr-1",
        ),
      ).rejects.toThrow(error);

      expect(commons.logError).toHaveBeenCalledWith(
        "order-db",
        "Failed to update order and result status",
        {
          error,
          orderUid: "order-1",
        },
      );
    });
  });
});
