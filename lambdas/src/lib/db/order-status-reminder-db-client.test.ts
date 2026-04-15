import { NotifyEventCode } from "../types/notify-message";
import { type DBClient } from "./db-client";
import { OrderStatusCodes } from "./order-status-db";
import {
  OrderStatusReminderDbClient,
  type ReminderScheduleTuple,
} from "./order-status-reminder-db-client";

const normalizeWhitespace = (sql: string): string => sql.replace(/\s+/g, " ").trim();

describe("OrderStatusReminderDbClient", () => {
  let dbClient: jest.Mocked<Pick<DBClient, "query" | "withTransaction" | "close">>;
  let client: OrderStatusReminderDbClient;

  beforeEach(() => {
    jest.clearAllMocks();

    dbClient = {
      query: jest.fn(),
      withTransaction: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    client = new OrderStatusReminderDbClient(dbClient as DBClient);
  });

  describe("getScheduledReminders", () => {
    const schedules: ReminderScheduleTuple[] = [
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

    const expectedQuery = `
      SELECT r.reminder_id, r.order_uid, r.trigger_status, r.reminder_number, r.triggered_at
      FROM order_status_reminder r
      JOIN unnest($1::text[], $2::smallint[], $3::integer[]) AS s(trigger_status, reminder_number, interval_days)
        ON r.trigger_status = s.trigger_status
       AND r.reminder_number = s.reminder_number
      WHERE r.status = 'SCHEDULED'
        AND r.triggered_at + (s.interval_days * INTERVAL '1 day') <= NOW()
    `;

    it("returns an empty array without querying the DB when schedules list is empty", async () => {
      const result = await client.getScheduledReminders([]);

      expect(result).toEqual([]);
      expect(dbClient.query).not.toHaveBeenCalled();
    });

    it("executes the correct SQL with parallel arrays built from the schedules", async () => {
      dbClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await client.getScheduledReminders(schedules);

      expect(dbClient.query).toHaveBeenCalledTimes(1);
      expect(normalizeWhitespace(dbClient.query.mock.calls[0][0])).toBe(
        normalizeWhitespace(expectedQuery),
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

      const result = await client.getScheduledReminders(schedules);

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

  describe("markReminderAsQueued", () => {
    const expectedQuery = `
      UPDATE order_status_reminder
      SET status = 'QUEUED', sent_at = NOW()
      WHERE reminder_id = $1::uuid
    `;

    it("executes the correct SQL with the reminder ID", async () => {
      dbClient.query.mockResolvedValue({ rows: [], rowCount: 1 });

      await client.markReminderAsQueued("8d5fd7df-fd20-448f-8b22-b3f145b6e336");

      expect(dbClient.query).toHaveBeenCalledTimes(1);
      expect(normalizeWhitespace(dbClient.query.mock.calls[0][0])).toBe(
        normalizeWhitespace(expectedQuery),
      );
      expect(dbClient.query.mock.calls[0][1]).toEqual(["8d5fd7df-fd20-448f-8b22-b3f145b6e336"]);
    });
  });

  describe("markReminderAsFailed", () => {
    const expectedQuery = `
      UPDATE order_status_reminder
      SET status = 'FAILED'
      WHERE reminder_id = $1::uuid
    `;

    it("executes the correct SQL with the reminder ID", async () => {
      dbClient.query.mockResolvedValue({ rows: [], rowCount: 1 });

      await client.markReminderAsFailed("2ddb4bcb-ee7f-4f89-a126-30e56fc23338");

      expect(dbClient.query).toHaveBeenCalledTimes(1);
      expect(normalizeWhitespace(dbClient.query.mock.calls[0][0])).toBe(
        normalizeWhitespace(expectedQuery),
      );
      expect(dbClient.query.mock.calls[0][1]).toEqual(["2ddb4bcb-ee7f-4f89-a126-30e56fc23338"]);
    });
  });

  describe("scheduleReminder", () => {
    const triggeredAt = new Date("2026-04-01T00:00:00.000Z");

    const expectedQuery = `
      INSERT INTO order_status_reminder (order_uid, trigger_status, reminder_number, status, triggered_at)
      VALUES ($1::uuid, $2, $3::smallint, 'SCHEDULED', $4)
    `;

    it("executes the correct SQL with all parameters", async () => {
      dbClient.query.mockResolvedValue({ rows: [], rowCount: 1 });

      await client.scheduleReminder(
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
});
