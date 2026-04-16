import { type DBClient } from "../../../lib/db/db-client";
import { type OrderStatusCode } from "../../../lib/db/order-status-db";
import { type OrderStatusReminderRecord, type ReminderScheduleTuple } from "../types";

export class GetScheduledRemindersQuery {
  constructor(private readonly dbClient: DBClient) {}

  async execute(schedules: ReminderScheduleTuple[]): Promise<OrderStatusReminderRecord[]> {
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
        AND r.triggered_at + (s.interval_days * INTERVAL '1 day') <= NOW();
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
}
