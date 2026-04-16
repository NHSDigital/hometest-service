import { type DBClient } from "../../../lib/db/db-client";
import { OrderStatusCodes } from "../../../lib/db/order-status-db";
import { ScheduleReminderCommand } from "./schedule-reminder";

const normalizeWhitespace = (sql: string): string => sql.replace(/\s+/g, " ").trim();

describe("ScheduleReminderCommand", () => {
  let dbClient: jest.Mocked<Pick<DBClient, "query" | "withTransaction" | "close">>;
  let command: ScheduleReminderCommand;

  beforeEach(() => {
    jest.clearAllMocks();

    dbClient = {
      query: jest.fn(),
      withTransaction: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    command = new ScheduleReminderCommand(dbClient as DBClient);
  });

  const triggeredAt = new Date("2026-04-01T00:00:00.000Z");

  const expectedQuery = `
      INSERT INTO order_status_reminder (order_uid, trigger_status, reminder_number, status, triggered_at)
      VALUES ($1::uuid, $2, $3::smallint, 'SCHEDULED', $4);
    `;

  it("executes the correct SQL with all parameters", async () => {
    dbClient.query.mockResolvedValue({ rows: [], rowCount: 1 });

    await command.execute(
      "9f44d6e9-7829-49f1-a327-8eca95f5db32",
      OrderStatusCodes.DISPATCHED,
      2,
      triggeredAt,
    );

    expect(dbClient.query).toHaveBeenCalledTimes(1);
    expect(normalizeWhitespace(dbClient.query.mock.calls[0][0])).toBe(
      normalizeWhitespace(expectedQuery),
    );
    expect(dbClient.query.mock.calls[0][1]).toEqual([
      "9f44d6e9-7829-49f1-a327-8eca95f5db32",
      OrderStatusCodes.DISPATCHED,
      2,
      triggeredAt,
    ]);
  });
});
