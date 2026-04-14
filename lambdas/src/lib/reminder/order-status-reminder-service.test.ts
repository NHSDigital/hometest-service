import { OrderStatusCodes } from "../db/order-status-db";
import { OrderStatusReminderStatus } from "../db/order-status-reminder-db-client";
import { OrderStatusReminderService } from "./order-status-reminder-service";

describe("OrderStatusReminderService", () => {
  const mockInsertOrderStatusReminder = jest.fn();

  let service: OrderStatusReminderService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockInsertOrderStatusReminder.mockResolvedValue(undefined);

    service = new OrderStatusReminderService({
      orderStatusReminderDbClient: {
        insertOrderStatusReminder: mockInsertOrderStatusReminder,
      } as never,
    });
  });

  it("should do nothing for statuses without reminder side effects", async () => {
    await service.handleOrderStatusUpdated({
      orderId: "550e8400-e29b-41d4-a716-446655440000",
      correlationId: "123e4567-e89b-12d3-a456-426614174000",
      statusCode: OrderStatusCodes.CONFIRMED,
    });

    expect(mockInsertOrderStatusReminder).not.toHaveBeenCalled();
  });

  it("should schedule initial reminder for dispatched status", async () => {
    await service.handleOrderStatusUpdated({
      orderId: "550e8400-e29b-41d4-a716-446655440000",
      correlationId: "123e4567-e89b-12d3-a456-426614174000",
      statusCode: OrderStatusCodes.DISPATCHED,
    });

    expect(mockInsertOrderStatusReminder).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "550e8400-e29b-41d4-a716-446655440000",
        triggerStatus: OrderStatusCodes.DISPATCHED,
        reminderNumber: 1,
        status: OrderStatusReminderStatus.SCHEDULED,
      }),
    );
    expect(mockInsertOrderStatusReminder).toHaveBeenCalledWith(
      expect.objectContaining({
        triggeredAt: expect.any(String),
      }),
    );
  });

  it("should swallow reminder insertion errors", async () => {
    mockInsertOrderStatusReminder.mockRejectedValueOnce(new Error("Insert failed"));

    await expect(
      service.handleOrderStatusUpdated({
        orderId: "550e8400-e29b-41d4-a716-446655440000",
        correlationId: "123e4567-e89b-12d3-a456-426614174000",
        statusCode: OrderStatusCodes.DISPATCHED,
      }),
    ).resolves.toBeUndefined();

    expect(mockInsertOrderStatusReminder).toHaveBeenCalledTimes(1);
  });
});
