import { type DBClient } from "../../../lib/db/db-client";

export class MarkReminderAsQueuedCommand {
  constructor(private readonly dbClient: DBClient) {}

  async execute(reminderId: string): Promise<void> {
    const query = `
      UPDATE order_status_reminder
      SET status = 'QUEUED', sent_at = NOW()
      WHERE reminder_id = $1::uuid;
    `;

    await this.dbClient.query<void, [string]>(query, [reminderId]);
  }
}
