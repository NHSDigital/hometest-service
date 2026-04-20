import { type DBClient } from "./db-client";
import { type OrderStatusCode } from "./order-status-db";

export enum OrderStatusReminderStatus {
  SCHEDULED = "SCHEDULED",
  QUEUED = "QUEUED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export interface InsertOrderStatusReminderParams {
  orderId: string;
  triggerStatus: OrderStatusCode;
  reminderNumber: number;
  status: OrderStatusReminderStatus;
  triggeredAt: string;
}

export class OrderStatusReminderDbClient {
  constructor(private readonly dbClient: DBClient) {}

  async insertOrderStatusReminder(params: InsertOrderStatusReminderParams): Promise<void> {
    const { orderId, triggerStatus, reminderNumber, status, triggeredAt } = params;

    const query = `
      INSERT INTO order_status_reminder (
        order_uid,
        trigger_status,
        reminder_number,
        status,
        triggered_at
      )
      VALUES ($1::uuid, $2, $3::smallint, $4::reminder_status, $5::timestamptz)
    `;

    try {
      const result = await this.dbClient.query(query, [
        orderId,
        triggerStatus,
        reminderNumber,
        status,
        triggeredAt,
      ]);

      if (result.rowCount === 0) {
        throw new Error("Failed to insert order status reminder");
      }
    } catch (error) {
      throw new Error(`Failed to insert order status reminder for orderId ${orderId}`, {
        cause: error,
      });
    }
  }
}
