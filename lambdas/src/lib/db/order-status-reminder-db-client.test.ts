import { type DBClient } from "./db-client";
import { OrderStatusCodes } from "./order-status-db";
import {
  InsertOrderStatusReminderParams,
  OrderStatusReminderDbClient,
  OrderStatusReminderStatus,
} from "./order-status-reminder-db-client";

const mockQuery = jest.fn();

describe("OrderStatusReminderDbClient", () => {
  let client: OrderStatusReminderDbClient;

  beforeEach(() => {
    jest.clearAllMocks();

    const dbClient: DBClient = {
      query: mockQuery,
      withTransaction: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    client = new OrderStatusReminderDbClient(dbClient);
  });

  it("should insert order status reminder", async () => {
    const params: InsertOrderStatusReminderParams = {
      orderId: "123e4567-e89b-12d3-a456-426614174000",
      triggerStatus: OrderStatusCodes.DISPATCHED,
      reminderNumber: 1,
      status: OrderStatusReminderStatus.SCHEDULED,
      triggeredAt: "2026-04-14T10:00:00.000Z",
    };

    mockQuery.mockResolvedValue({
      rows: [],
      rowCount: 1,
    });

    await expect(client.insertOrderStatusReminder(params)).resolves.toBeUndefined();

    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("order_status_reminder"), [
      params.orderId,
      params.triggerStatus,
      params.reminderNumber,
      params.status,
      params.triggeredAt,
    ]);
  });

  it("should throw when order status reminder insert affects no rows", async () => {
    mockQuery.mockResolvedValue({
      rows: [],
      rowCount: 0,
    });

    await expect(
      client.insertOrderStatusReminder({
        orderId: "123e4567-e89b-12d3-a456-426614174000",
        triggerStatus: OrderStatusCodes.DISPATCHED,
        reminderNumber: 1,
        status: OrderStatusReminderStatus.SCHEDULED,
        triggeredAt: "2026-04-14T10:00:00.000Z",
      }),
    ).rejects.toThrow("Failed to insert order status reminder");
  });
});
