import { type DBClient } from "../../../lib/db/db-client";
import { OrderStatusCodes } from "../../../lib/db/order-status-db";
import { NotifyEventCode } from "../../../lib/types/notify-message";
import { type ReminderSchedule } from "../../processor/schedules";
import { GetScheduledRemindersQuery } from "./get-scheduled-reminders";

const normalizeWhitespace = (sql: string): string => sql.replace(/\s+/g, " ").trim();

describe("GetScheduledRemindersQuery", () => {
  let dbClient: jest.Mocked<Pick<DBClient, "query" | "withTransaction" | "close">>;
  let query: GetScheduledRemindersQuery;

  beforeEach(() => {
    jest.clearAllMocks();

    dbClient = {
      query: jest.fn(),
      withTransaction: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    query = new GetScheduledRemindersQuery(dbClient as DBClient);
  });

  const schedules: ReminderSchedule[] = [
    {
      triggerStatus: OrderStatusCodes.DISPATCHED,
      reminderNumber: 1,
      intervalDays: 7,
      eventCode: NotifyEventCode.DispatchedInitialReminder,
    },
    {
      triggerStatus: OrderStatusCodes.DISPATCHED,
      reminderNumber: 2,
      intervalDays: 14,
      eventCode: NotifyEventCode.DispatchedSecondReminder,
    },
  ];

  const triggeredAt = new Date("2026-04-01T00:00:00.000Z");

  const expectedSql = `
      SELECT r.reminder_id, r.order_uid, r.trigger_status, r.reminder_number, r.triggered_at
      FROM order_status_reminder r
      JOIN unnest($1::text[], $2::smallint[], $3::integer[]) AS s(trigger_status, reminder_number, interval_days)
        ON r.trigger_status = s.trigger_status
       AND r.reminder_number = s.reminder_number
      WHERE r.status = 'SCHEDULED'
        AND r.triggered_at + (s.interval_days * INTERVAL '1 day') <= NOW();
    `;

  it("returns an empty array without querying the DB when schedules list is empty", async () => {
    const result = await query.execute([]);

    expect(result).toEqual([]);
    expect(dbClient.query).not.toHaveBeenCalled();
  });

  it("executes the correct SQL with parallel arrays built from the schedules", async () => {
    dbClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

    await query.execute(schedules);

    expect(dbClient.query).toHaveBeenCalledTimes(1);
    expect(normalizeWhitespace(dbClient.query.mock.calls[0][0])).toBe(
      normalizeWhitespace(expectedSql),
    );
    expect(dbClient.query.mock.calls[0][1]).toEqual([
      [OrderStatusCodes.DISPATCHED, OrderStatusCodes.DISPATCHED],
      [1, 2],
      [7, 14],
    ]);
  });

  it("maps DB rows to camelCase OrderStatusReminderRecord objects", async () => {
    dbClient.query.mockResolvedValue({
      rows: [
        {
          reminder_id: "8d5fd7df-fd20-448f-8b22-b3f145b6e336",
          order_uid: "9f44d6e9-7829-49f1-a327-8eca95f5db32",
          trigger_status: OrderStatusCodes.DISPATCHED,
          reminder_number: 1,
          triggered_at: triggeredAt,
        },
      ],
      rowCount: 1,
    });

    const result = await query.execute(schedules);

    expect(result).toEqual([
      {
        reminderId: "8d5fd7df-fd20-448f-8b22-b3f145b6e336",
        orderUid: "9f44d6e9-7829-49f1-a327-8eca95f5db32",
        triggerStatus: OrderStatusCodes.DISPATCHED,
        reminderNumber: 1,
        triggeredAt,
      },
    ]);
  });
});
