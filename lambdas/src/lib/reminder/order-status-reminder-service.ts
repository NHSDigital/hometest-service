import { OrderStatusCode, OrderStatusCodes } from "../db/order-status-db";
import {
  OrderStatusReminderDbClient,
  OrderStatusReminderStatus,
} from "../db/order-status-reminder-db-client";

const name = "order-status-reminder-service";

export interface OrderStatusReminderServiceDependencies {
  orderStatusReminderDbClient: OrderStatusReminderDbClient;
}

export interface HandleOrderStatusUpdatedInput {
  orderId: string;
  correlationId: string;
  statusCode: OrderStatusCode;
  triggeredAt: string;
}

type ReminderByStatus = Partial<
  Record<OrderStatusCode, (input: HandleOrderStatusUpdatedInput) => Promise<void>>
>;

export class OrderStatusReminderService {
  constructor(private readonly dependencies: OrderStatusReminderServiceDependencies) {}

  async handleOrderStatusUpdated(input: HandleOrderStatusUpdatedInput): Promise<void> {
    const { statusCode, correlationId, orderId } = input;
    const { orderStatusReminderDbClient } = this.dependencies;

    const handleReminderByStatus: ReminderByStatus = {
      [OrderStatusCodes.DISPATCHED]: async ({ orderId, triggeredAt }) => {
        await orderStatusReminderDbClient.insertOrderStatusReminder({
          orderId,
          triggerStatus: OrderStatusCodes.DISPATCHED,
          reminderNumber: 1,
          status: OrderStatusReminderStatus.SCHEDULED,
          triggeredAt,
        });
      },
    };

    const handleReminder = handleReminderByStatus[statusCode];

    if (!handleReminder) {
      return;
    }

    try {
      await handleReminder(input);
    } catch (error) {
      console.error(name, "Failed to schedule order status reminder", {
        correlationId,
        orderId,
        statusCode,
        error,
      });
    }
  }
}
