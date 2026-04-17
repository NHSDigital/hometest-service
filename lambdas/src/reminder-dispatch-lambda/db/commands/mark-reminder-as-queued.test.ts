import { type DBClient } from "../../../lib/db/db-client";
import { MarkReminderAsQueuedCommand } from "./mark-reminder-as-queued";

const normalizeWhitespace = (sql: string): string => sql.replace(/\s+/g, " ").trim();

describe("MarkReminderAsQueuedCommand", () => {
  let dbClient: jest.Mocked<Pick<DBClient, "query" | "withTransaction" | "close">>;
  let command: MarkReminderAsQueuedCommand;

  beforeEach(() => {
    jest.clearAllMocks();

    dbClient = {
      query: jest.fn(),
      withTransaction: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    command = new MarkReminderAsQueuedCommand(dbClient as DBClient);
  });

  const expectedQuery = `
      UPDATE order_status_reminder
      SET status = 'QUEUED', sent_at = NOW()
      WHERE reminder_id = $1::uuid;
    `;

  it("executes the correct SQL with the reminder ID", async () => {
    dbClient.query.mockResolvedValue({ rows: [], rowCount: 1 });

    await command.execute("8d5fd7df-fd20-448f-8b22-b3f145b6e336");

    expect(dbClient.query).toHaveBeenCalledTimes(1);
    expect(normalizeWhitespace(dbClient.query.mock.calls[0][0])).toBe(
      normalizeWhitespace(expectedQuery),
    );
    expect(dbClient.query.mock.calls[0][1]).toEqual(["8d5fd7df-fd20-448f-8b22-b3f145b6e336"]);
  });
});
