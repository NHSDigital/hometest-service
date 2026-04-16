import { OrderStatusCodes } from "../../lib/db/order-status-db";
import { NotifyEventCode } from "../../lib/types/notify-message";
import { type OrderStatusReminderRecord } from "../db/types";
import {
  ReminderProcessor,
  type ReminderProcessorContext,
  type ReminderProcessorDeps,
} from "./reminder-processor";
import { type ReminderSchedule } from "./schedules";

const TRIGGERED_AT = new Date("2026-04-01T00:00:00.000Z");
const correlationId = "75085c10-f0f6-4e9c-b8e1-093432fedfc4";

const reminder1: OrderStatusReminderRecord = {
  reminderId: "8d5fd7df-fd20-448f-8b22-b3f145b6e336",
  orderUid: "9f44d6e9-7829-49f1-a327-8eca95f5db32",
  triggerStatus: OrderStatusCodes.DISPATCHED,
  reminderNumber: 1,
  triggeredAt: TRIGGERED_AT,
};

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

describe("ReminderProcessor", () => {
  const mockNotify = jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined);
  const mockMarkReminderAsQueued = jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined);
  const mockMarkReminderAsFailed = jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined);
  const mockScheduleReminder = jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined);

  const buildProcessor = (overrides?: Partial<ReminderProcessorDeps>): ReminderProcessor =>
    new ReminderProcessor({
      reminderNotifyService: { dispatch: mockNotify } as never,
      markReminderAsQueuedCommand: { execute: mockMarkReminderAsQueued } as never,
      markReminderAsFailedCommand: { execute: mockMarkReminderAsFailed } as never,
      scheduleReminderCommand: { execute: mockScheduleReminder } as never,
      ...overrides,
    });

  const defaultContext: ReminderProcessorContext = {
    schedules,
    enabledReminderStatuses: new Set([OrderStatusCodes.DISPATCHED]),
    correlationId,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("successful dispatch", () => {
    it("dispatches the reminder with the correct arguments", async () => {
      await buildProcessor().process(reminder1, defaultContext);

      expect(mockNotify).toHaveBeenCalledWith({
        reminderId: reminder1.reminderId,
        orderId: reminder1.orderUid,
        correlationId,
        statusCode: OrderStatusCodes.DISPATCHED,
        eventCode: NotifyEventCode.DispatchedInitialReminder,
      });
    });

    it("marks the reminder as queued after dispatch", async () => {
      await buildProcessor().process(reminder1, defaultContext);

      expect(mockMarkReminderAsQueued).toHaveBeenCalledWith(reminder1.reminderId);
    });

    it("returns 'dispatched'", async () => {
      const result = await buildProcessor().process(reminder1, defaultContext);

      expect(result).toBe("dispatched");
    });

    it("schedules the next reminder when another exists in the series", async () => {
      await buildProcessor().process(reminder1, defaultContext);

      expect(mockScheduleReminder).toHaveBeenCalledWith(
        reminder1.orderUid,
        OrderStatusCodes.DISPATCHED,
        2,
        TRIGGERED_AT,
      );
    });

    it("still returns 'dispatched' when scheduling the next reminder throws", async () => {
      mockScheduleReminder.mockRejectedValueOnce(new Error("DB write failed"));

      const result = await buildProcessor().process(reminder1, defaultContext);

      expect(result).toBe("dispatched");
    });

    it("does not schedule a next reminder for the last in the series", async () => {
      const lastReminder: OrderStatusReminderRecord = { ...reminder1, reminderNumber: 2 };

      await buildProcessor().process(lastReminder, defaultContext);

      expect(mockScheduleReminder).not.toHaveBeenCalled();
    });
  });

  describe("dispatch failure", () => {
    it("marks the reminder as failed and returns 'failed' when dispatch throws", async () => {
      mockNotify.mockRejectedValueOnce(new Error("Notify service unavailable"));

      const result = await buildProcessor().process(reminder1, defaultContext);

      expect(mockMarkReminderAsFailed).toHaveBeenCalledWith(reminder1.reminderId);
      expect(result).toBe("failed");
    });

    it("still returns 'failed' when both dispatch and marking as failed throw", async () => {
      mockNotify.mockRejectedValueOnce(new Error("Notify service unavailable"));
      mockMarkReminderAsFailed.mockRejectedValueOnce(new Error("DB write failed"));

      const result = await buildProcessor().process(reminder1, defaultContext);

      expect(result).toBe("failed");
    });

    it("does not schedule the next reminder when dispatch fails", async () => {
      mockNotify.mockRejectedValueOnce(new Error("Notify service unavailable"));

      await buildProcessor().process(reminder1, defaultContext);

      expect(mockScheduleReminder).not.toHaveBeenCalled();
    });

    it("returns 'failed' when marking as queued throws", async () => {
      mockMarkReminderAsQueued.mockRejectedValueOnce(new Error("DB write failed"));

      const result = await buildProcessor().process(reminder1, defaultContext);

      expect(result).toBe("failed");
      expect(mockScheduleReminder).not.toHaveBeenCalled();
    });
  });

  describe("skipped outcomes", () => {
    it("returns 'skipped_disabled' when the trigger status is not in the enabled set", async () => {
      const context: ReminderProcessorContext = {
        ...defaultContext,
        enabledReminderStatuses: new Set([OrderStatusCodes.RECEIVED]),
      };

      const result = await buildProcessor().process(reminder1, context);

      expect(result).toBe("skipped_disabled");
      expect(mockNotify).not.toHaveBeenCalled();
    });
  });
});
