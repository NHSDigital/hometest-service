import { OrderStatusCodes } from "../../lib/db/order-status-db";
import { NotifyEventCode } from "../../lib/types/notify-message";
import { buildSchedules } from "./schedules";

describe("buildSchedules", () => {
  it("converts a ReminderConfiguration into a flat list of ReminderScheduleTuples with 1-based reminderNumber", () => {
    const result = buildSchedules({
      [OrderStatusCodes.DISPATCHED]: [
        { interval: 7, eventCode: NotifyEventCode.DispatchedInitialReminder },
        { interval: 14, eventCode: NotifyEventCode.DispatchedSecondReminder },
      ],
    });

    expect(result).toEqual([
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
    ]);
  });

  it("returns an empty array for an empty configuration", () => {
    expect(buildSchedules({})).toEqual([]);
  });

  it("returns an empty array for a status key with undefined schedules", () => {
    expect(buildSchedules({ [OrderStatusCodes.DISPATCHED]: undefined })).toEqual([]);
  });
});
