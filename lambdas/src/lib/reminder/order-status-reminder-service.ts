import { ConsoleCommons } from "../commons";
import { OrderStatusCode, OrderStatusCodes } from "../db/order-status-db";
import {
  OrderStatusReminderDbClient,
  OrderStatusReminderStatus,
} from "../db/order-status-reminder-db-client";

const commons = new ConsoleCommons();
const name = "order-status-reminder-service";

export interface OrderStatusReminderServiceDependencies {
  orderStatusReminderDbClient: OrderStatusReminderDbClient;
}

export interface HandleOrderStatusReminderInput {
  orderId: string;
  correlationId: string;
  statusCode: OrderStatusCode;
}

type ReminderHandlerByStatus = Partial<
  Record<OrderStatusCode, (input: HandleOrderStatusReminderInput) => Promise<void>>
>;

export class OrderStatusReminderService {
  constructor(private readonly dependencies: OrderStatusReminderServiceDependencies) {}

  async handleOrderStatusUpdated(input: HandleOrderStatusReminderInput): Promise<void> {
    const { statusCode, correlationId, orderId } = input;
    const { orderStatusReminderDbClient } = this.dependencies;

    const handleReminderByStatus: ReminderHandlerByStatus = {
      [OrderStatusCodes.DISPATCHED]: async ({ orderId }) => {
        await orderStatusReminderDbClient.insertOrderStatusReminder({
          orderId,
          triggerStatus: OrderStatusCodes.DISPATCHED,
          reminderNumber: 1,
          status: OrderStatusReminderStatus.SCHEDULED,
          triggeredAt: new Date().toISOString(),
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
      commons.logError(name, "Failed to schedule order status reminder", {
        correlationId,
        orderId,
        statusCode,
        error,
      });
    }
  }
}
