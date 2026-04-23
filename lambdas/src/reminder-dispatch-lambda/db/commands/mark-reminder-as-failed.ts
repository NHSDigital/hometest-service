import { type DBClient } from "../../../lib/db/db-client";

export class MarkReminderAsFailedCommand {
  constructor(private readonly dbClient: DBClient) {}

  async execute(reminderId: string): Promise<void> {
    const query = `
      UPDATE order_status_reminder
      SET status = 'FAILED'
      WHERE reminder_id = $1::uuid;
    `;

    await this.dbClient.query<void, [string]>(query, [reminderId]);
  }
}
