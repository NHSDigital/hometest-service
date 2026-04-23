import { UUID } from "../models/TestOrder";
import { ReminderModel, ReminderStatusCode } from "../models/TestReminder";
import { BaseDbClient } from "./BaseDbClient";

export class TestRemindersDbClient extends BaseDbClient {
  async getRemindersByOrderUid(orderUid: UUID): Promise<ReminderModel[]> {
    return this.query<ReminderModel>(
      `SELECT reminder_id, order_uid, trigger_status, reminder_number, status, triggered_at, sent_at, created_at
       FROM order_status_reminder
       WHERE order_uid = $1
       ORDER BY reminder_number ASC`,
      [orderUid],
    );
  }

  async getRemindersCountByOrderUid(orderUid: UUID): Promise<number> {
    const rows = await this.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM order_status_reminder WHERE order_uid = $1`,
      [orderUid],
    );
    return Number(rows[0].count);
  }

  async getReminderStatusByOrderUidAndReminderNumber(
    orderUid: UUID,
    reminderNumber: number,
  ): Promise<ReminderStatusCode> {
    const rows = await this.query<{ status: string }>(
      `SELECT status FROM order_status_reminder WHERE order_uid = $1 and reminder_number = $2`,
      [orderUid, reminderNumber],
    );
    return rows[0].status as ReminderStatusCode;
  }

  async deleteRemindersByOrderUid(orderUid: UUID): Promise<void> {
    await this.query(`DELETE FROM order_status_reminder WHERE order_uid = $1`, [orderUid]);
  }

  async updateReminderTriggeredAt(
    orderUid: UUID,
    reminderNumber: number,
    daysBack: 7 | 15 | 30 | 45,
  ): Promise<void> {
    await this.query(
      `UPDATE order_status_reminder
       SET triggered_at = NOW() - ($1::int * INTERVAL '1 day')
       WHERE order_uid = $2 AND reminder_number = $3`,
      [daysBack, orderUid, reminderNumber],
    );
  }
}
