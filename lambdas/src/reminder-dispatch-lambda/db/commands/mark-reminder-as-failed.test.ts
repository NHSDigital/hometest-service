import { type DBClient } from "../../../lib/db/db-client";
import { MarkReminderAsFailedCommand } from "./mark-reminder-as-failed";

const normalizeWhitespace = (sql: string): string => sql.replace(/\s+/g, " ").trim();

describe("MarkReminderAsFailedCommand", () => {
  let dbClient: jest.Mocked<Pick<DBClient, "query" | "withTransaction" | "close">>;
  let command: MarkReminderAsFailedCommand;

  beforeEach(() => {
    jest.clearAllMocks();

    dbClient = {
      query: jest.fn(),
      withTransaction: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    command = new MarkReminderAsFailedCommand(dbClient as DBClient);
  });

  const expectedQuery = `
      UPDATE order_status_reminder
      SET status = 'FAILED'
      WHERE reminder_id = $1::uuid;
    `;

  it("executes the correct SQL with the reminder ID", async () => {
    dbClient.query.mockResolvedValue({ rows: [], rowCount: 1 });

    await command.execute("2ddb4bcb-ee7f-4f89-a126-30e56fc23338");

    expect(dbClient.query).toHaveBeenCalledTimes(1);
    expect(normalizeWhitespace(dbClient.query.mock.calls[0][0])).toBe(
      normalizeWhitespace(expectedQuery),
    );
    expect(dbClient.query.mock.calls[0][1]).toEqual(["2ddb4bcb-ee7f-4f89-a126-30e56fc23338"]);
  });
});
