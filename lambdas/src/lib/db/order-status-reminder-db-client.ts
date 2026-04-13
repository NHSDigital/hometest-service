import { type DBClient } from "./db-client";
import { type OrderStatusCode, OrderStatusCodes } from "./order-status-db";

export interface OrderStatusReminderRecord {
  reminderId: string;
  orderUid: string;
  statusCode: OrderStatusCode;
  reminderNumber: number;
}

export class OrderStatusReminderDbClient {
  constructor(private readonly dbClient: DBClient) {}

  async getPendingReminders(): Promise<OrderStatusReminderRecord[]> {
    // Temporary mock data. Replace with a DB query against order_status_reminder.
    return [
      {
        reminderId: "8d5fd7df-fd20-448f-8b22-b3f145b6e336",
        orderUid: "9f44d6e9-7829-49f1-a327-8eca95f5db32",
        statusCode: OrderStatusCodes.DISPATCHED,
        reminderNumber: 1,
      },
      {
        reminderId: "2ddb4bcb-ee7f-4f89-a126-30e56fc23338",
        orderUid: "7f97f8a4-75f3-47dc-8faf-f7f9ca6ec1ac",
        statusCode: OrderStatusCodes.DISPATCHED,
        reminderNumber: 2,
      },
    ];
  }
}
