import { type DBClient } from "./db-client";
import { type OrderStatusCode } from "./order-status-db";

export interface OrderStatusReminderRecord {
  reminderId: string;
  orderUid: string;
  triggerStatus: OrderStatusCode;
  reminderNumber: number;
  triggeredAt: Date;
}

export interface ReminderScheduleTuple {
  triggerStatus: string;
  reminderNumber: number;
  intervalDays: number;
  eventCode: string;
}

export class OrderStatusReminderDbClient {
  constructor(private readonly dbClient: DBClient) {}

  async getScheduledReminders(
    schedules: ReminderScheduleTuple[],
  ): Promise<OrderStatusReminderRecord[]> {
    if (schedules.length === 0) {
      return [];
    }

    const triggerStatuses = schedules.map((s) => s.triggerStatus);
    const reminderNumbers = schedules.map((s) => s.reminderNumber);
    const intervalDays = schedules.map((s) => s.intervalDays);

    const query = `
      SELECT r.reminder_id, r.order_uid, r.trigger_status, r.reminder_number, r.triggered_at
      FROM order_status_reminder r
      JOIN unnest($1::text[], $2::smallint[], $3::integer[]) AS s(trigger_status, reminder_number, interval_days)
        ON r.trigger_status = s.trigger_status
       AND r.reminder_number = s.reminder_number
      WHERE r.status = 'SCHEDULED'
        AND r.triggered_at + (s.interval_days * INTERVAL '1 day') <= NOW()
    `;

    const result = await this.dbClient.query<
      {
        reminder_id: string;
        order_uid: string;
        trigger_status: string;
        reminder_number: number;
        triggered_at: Date;
      },
      [string[], number[], number[]]
    >(query, [triggerStatuses, reminderNumbers, intervalDays]);

    return result.rows.map((row) => ({
      reminderId: row.reminder_id,
      orderUid: row.order_uid,
      triggerStatus: row.trigger_status as OrderStatusCode,
      reminderNumber: row.reminder_number,
      triggeredAt: row.triggered_at,
    }));
  }

  async markReminderAsQueued(reminderId: string): Promise<void> {
    const query = `
      UPDATE order_status_reminder
      SET status = 'QUEUED', sent_at = NOW()
      WHERE reminder_id = $1::uuid
    `;

    await this.dbClient.query<void, [string]>(query, [reminderId]);
  }

  async markReminderAsFailed(reminderId: string): Promise<void> {
    const query = `
      UPDATE order_status_reminder
      SET status = 'FAILED'
      WHERE reminder_id = $1::uuid
    `;

    await this.dbClient.query<void, [string]>(query, [reminderId]);
  }

  async scheduleReminder(
    orderUid: string,
    triggerStatus: string,
    reminderNumber: number,
    triggeredAt: Date,
  ): Promise<void> {
    const query = `
      INSERT INTO order_status_reminder (order_uid, trigger_status, reminder_number, status, triggered_at)
      VALUES ($1::uuid, $2, $3::smallint, 'SCHEDULED', $4)
    `;

    await this.dbClient.query<void, [string, string, number, Date]>(query, [
      orderUid,
      triggerStatus,
      reminderNumber,
      triggeredAt,
    ]);
  }
}
