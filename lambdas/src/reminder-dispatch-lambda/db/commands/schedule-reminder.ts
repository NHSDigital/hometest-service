import { type DBClient } from "../../../lib/db/db-client";
import { type OrderStatusCode } from "../../../lib/db/order-status-db";

export class ScheduleReminderCommand {
  constructor(private readonly dbClient: DBClient) {}

  async execute(
    orderUid: string,
    triggerStatus: OrderStatusCode,
    reminderNumber: number,
    triggeredAt: Date,
  ): Promise<void> {
    const query = `
      INSERT INTO order_status_reminder (order_uid, trigger_status, reminder_number, status, triggered_at)
      VALUES ($1::uuid, $2, $3::smallint, 'SCHEDULED', $4);
    `;

    await this.dbClient.query<void, [string, OrderStatusCode, number, Date]>(query, [
      orderUid,
      triggerStatus,
      reminderNumber,
      triggeredAt,
    ]);
  }
}
