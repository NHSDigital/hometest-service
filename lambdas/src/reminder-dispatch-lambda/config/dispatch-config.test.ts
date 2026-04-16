import { OrderStatusCodes } from "../../lib/db/order-status-db";
import {
  restoreEnvironment,
  setupEnvironment,
} from "../../lib/test-utils/environment-test-helpers";
import { getReminderDispatchConfigFromEnv } from "./dispatch-config";

describe("getReminderDispatchConfigFromEnv", () => {
  const originalEnv = process.env;

  const baseEnv = {
    REMINDER_ENABLED_STATUSES: JSON.stringify([OrderStatusCodes.DISPATCHED]),
    REMINDER_INTERVAL_CONFIG: JSON.stringify({
      [OrderStatusCodes.DISPATCHED]: [
        { interval: 7, eventCode: "DISPATCHED_INITIAL_REMINDER" },
        { interval: 14, eventCode: "DISPATCHED_SECOND_REMINDER" },
      ],
    }),
  };

  beforeEach(() => {
    setupEnvironment(baseEnv);
  });

  afterEach(() => {
    restoreEnvironment(originalEnv);
  });

  describe("enabledReminderStatuses", () => {
    it("parses a valid status list", () => {
      const { enabledReminderStatuses } = getReminderDispatchConfigFromEnv();

      expect(enabledReminderStatuses.has(OrderStatusCodes.DISPATCHED)).toBe(true);
      expect(enabledReminderStatuses.size).toBe(1);
    });

    it("throws when REMINDER_ENABLED_STATUSES is missing", () => {
      delete process.env.REMINDER_ENABLED_STATUSES;

      expect(() => getReminderDispatchConfigFromEnv()).toThrow(
        "Missing value for an environment variable REMINDER_ENABLED_STATUSES",
      );
    });

    it("throws when REMINDER_ENABLED_STATUSES is not a JSON array", () => {
      process.env.REMINDER_ENABLED_STATUSES = '"DISPATCHED"';

      expect(() => getReminderDispatchConfigFromEnv()).toThrow(
        "REMINDER_ENABLED_STATUSES must be a JSON array of order status strings",
      );
    });

    it("throws when REMINDER_ENABLED_STATUSES is an empty array", () => {
      process.env.REMINDER_ENABLED_STATUSES = "[]";

      expect(() => getReminderDispatchConfigFromEnv()).toThrow(
        "REMINDER_ENABLED_STATUSES must contain at least one valid order status",
      );
    });

    it("throws when REMINDER_ENABLED_STATUSES contains an unrecognised status", () => {
      process.env.REMINDER_ENABLED_STATUSES = JSON.stringify([
        OrderStatusCodes.DISPATCHED,
        "NOT_A_REAL_STATUS",
      ]);

      expect(() => getReminderDispatchConfigFromEnv()).toThrow("is not a valid order status code");
    });
  });

  describe("reminderConfiguration", () => {
    it("parses a valid configuration with two schedules", () => {
      const { reminderConfiguration } = getReminderDispatchConfigFromEnv();

      expect(reminderConfiguration[OrderStatusCodes.DISPATCHED]).toEqual([
        { interval: 7, eventCode: "DISPATCHED_INITIAL_REMINDER" },
        { interval: 14, eventCode: "DISPATCHED_SECOND_REMINDER" },
      ]);
    });

    it("throws when REMINDER_INTERVAL_CONFIG is missing", () => {
      delete process.env.REMINDER_INTERVAL_CONFIG;

      expect(() => getReminderDispatchConfigFromEnv()).toThrow(
        "Missing value for an environment variable REMINDER_INTERVAL_CONFIG",
      );
    });

    it("throws when REMINDER_INTERVAL_CONFIG is not a JSON object", () => {
      process.env.REMINDER_INTERVAL_CONFIG = '"not-an-object"';

      expect(() => getReminderDispatchConfigFromEnv()).toThrow(
        "REMINDER_INTERVAL_CONFIG must be a JSON object",
      );
    });

    it("throws when REMINDER_INTERVAL_CONFIG contains an unrecognised status key", () => {
      process.env.REMINDER_INTERVAL_CONFIG = JSON.stringify({
        UNKNOWN_STATUS: [{ interval: 7, eventCode: "SOME_CODE" }],
      });

      expect(() => getReminderDispatchConfigFromEnv()).toThrow("Invalid key in record");
    });

    it("throws when a schedule entry has a non-positive interval", () => {
      process.env.REMINDER_INTERVAL_CONFIG = JSON.stringify({
        [OrderStatusCodes.DISPATCHED]: [
          { interval: 0, eventCode: "DISPATCHED_INITIAL_REMINDER" },
          { interval: 7, eventCode: "DISPATCHED_SECOND_REMINDER" },
        ],
      });

      expect(() => getReminderDispatchConfigFromEnv()).toThrow(
        "interval must be a positive number, received: 0",
      );
    });

    it("throws when a schedule entry has a non-number interval", () => {
      process.env.REMINDER_INTERVAL_CONFIG = JSON.stringify({
        [OrderStatusCodes.DISPATCHED]: [
          { interval: "seven", eventCode: "DISPATCHED_INITIAL_REMINDER" },
        ],
      });

      expect(() => getReminderDispatchConfigFromEnv()).toThrow(
        "interval must be a number, received: seven",
      );
    });

    it("throws when a schedule entry has an invalid eventCode", () => {
      process.env.REMINDER_INTERVAL_CONFIG = JSON.stringify({
        [OrderStatusCodes.DISPATCHED]: [
          { interval: 7, eventCode: "" },
          { interval: 14, eventCode: "DISPATCHED_SECOND_REMINDER" },
        ],
      });

      expect(() => getReminderDispatchConfigFromEnv()).toThrow(
        "eventCode must be a valid NotifyEventCode",
      );
    });
  });
});
