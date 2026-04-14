import { Context, EventBridgeEvent } from "aws-lambda";

import { OrderStatusCodes } from "../lib/db/order-status-db";
import { type OrderStatusReminderRecord } from "../lib/db/order-status-reminder-db-client";
import { NotifyEventCode } from "../lib/types/notify-message";
import { lambdaHandler } from "./index";
import { init } from "./init";

jest.mock("./init", () => ({
  init: jest.fn(),
}));

const TRIGGERED_AT = new Date("2026-04-01T00:00:00.000Z");

const DISPATCHED_REMINDER_1: OrderStatusReminderRecord = {
  reminderId: "8d5fd7df-fd20-448f-8b22-b3f145b6e336",
  orderUid: "9f44d6e9-7829-49f1-a327-8eca95f5db32",
  triggerStatus: OrderStatusCodes.DISPATCHED,
  reminderNumber: 1,
  triggeredAt: TRIGGERED_AT,
};

const DISPATCHED_REMINDER_2: OrderStatusReminderRecord = {
  reminderId: "2ddb4bcb-ee7f-4f89-a126-30e56fc23338",
  orderUid: "7f97f8a4-75f3-47dc-8faf-f7f9ca6ec1ac",
  triggerStatus: OrderStatusCodes.DISPATCHED,
  reminderNumber: 2,
  triggeredAt: TRIGGERED_AT,
};

describe("reminder-dispatch-lambda", () => {
  const mockNotify = jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined);
  const mockGetScheduledReminders = jest.fn<Promise<OrderStatusReminderRecord[]>, [unknown]>();
  const mockMarkReminderAsQueued = jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined);
  const mockMarkReminderAsFailed = jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined);
  const mockScheduleReminder = jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined);

  const mockedInit = jest.mocked(init);

  const mockEvent = {
    id: "75085c10-f0f6-4e9c-b8e1-093432fedfc4",
    version: "0",
    account: "123456789012",
    time: "2026-04-13T10:00:00Z",
    region: "eu-west-2",
    resources: [],
    source: "hometest.reminders",
    "detail-type": "ReminderDispatchEvent",
    detail: {},
  } as EventBridgeEvent<"ReminderDispatchEvent", Record<string, never>>;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.REMINDER_ENABLED_STATUSES = JSON.stringify([OrderStatusCodes.DISPATCHED]);
    process.env.REMINDER_INTERVAL_CONFIG = JSON.stringify({
      [OrderStatusCodes.DISPATCHED]: [
        { interval: 7, eventCode: NotifyEventCode.DispatchedInitialReminder },
        { interval: 14, eventCode: NotifyEventCode.DispatchedSecondReminder },
      ],
    });

    mockGetScheduledReminders.mockResolvedValue([DISPATCHED_REMINDER_1, DISPATCHED_REMINDER_2]);

    mockedInit.mockReturnValue({
      reminderNotifyService: {
        dispatch: mockNotify,
      },
      orderStatusReminderDbClient: {
        getScheduledReminders: mockGetScheduledReminders,
        markReminderAsQueued: mockMarkReminderAsQueued,
        markReminderAsFailed: mockMarkReminderAsFailed,
        scheduleReminder: mockScheduleReminder,
      },
    } as unknown as ReturnType<typeof init>);
  });

  afterEach(() => {
    delete process.env.REMINDER_ENABLED_STATUSES;
    delete process.env.REMINDER_INTERVAL_CONFIG;
  });

  it("calls notify for each pending reminder with the correct arguments", async () => {
    await lambdaHandler(mockEvent, {} as Context);

    expect(mockNotify).toHaveBeenCalledTimes(2);

    expect(mockNotify.mock.calls[0][0]).toMatchObject({
      reminderId: DISPATCHED_REMINDER_1.reminderId,
      orderId: DISPATCHED_REMINDER_1.orderUid,
      correlationId: mockEvent.id,
      statusCode: OrderStatusCodes.DISPATCHED,
      eventCode: NotifyEventCode.DispatchedInitialReminder,
    });

    expect(mockNotify.mock.calls[1][0]).toMatchObject({
      reminderId: DISPATCHED_REMINDER_2.reminderId,
      orderId: DISPATCHED_REMINDER_2.orderUid,
      correlationId: mockEvent.id,
      statusCode: OrderStatusCodes.DISPATCHED,
      eventCode: NotifyEventCode.DispatchedSecondReminder,
    });
  });

  it("marks each reminder as queued after successful dispatch", async () => {
    await lambdaHandler(mockEvent, {} as Context);

    expect(mockMarkReminderAsQueued).toHaveBeenCalledTimes(2);
    expect(mockMarkReminderAsQueued).toHaveBeenCalledWith(DISPATCHED_REMINDER_1.reminderId);
    expect(mockMarkReminderAsQueued).toHaveBeenCalledWith(DISPATCHED_REMINDER_2.reminderId);
  });

  it("schedules the next reminder when another exists in the series", async () => {
    await lambdaHandler(mockEvent, {} as Context);

    expect(mockScheduleReminder).toHaveBeenCalledTimes(1);
    expect(mockScheduleReminder).toHaveBeenCalledWith(
      DISPATCHED_REMINDER_1.orderUid,
      OrderStatusCodes.DISPATCHED,
      2,
      TRIGGERED_AT,
    );
  });

  it("does not schedule next reminder for the last in the series", async () => {
    mockGetScheduledReminders.mockResolvedValueOnce([DISPATCHED_REMINDER_2]);

    await lambdaHandler(mockEvent, {} as Context);

    expect(mockScheduleReminder).not.toHaveBeenCalled();
  });

  it("marks reminder as failed and continues to next when dispatch throws", async () => {
    const dispatchError = new Error("Notify service unavailable");
    mockNotify.mockRejectedValueOnce(dispatchError);

    await lambdaHandler(mockEvent, {} as Context);

    expect(mockMarkReminderAsFailed).toHaveBeenCalledTimes(1);
    expect(mockMarkReminderAsFailed).toHaveBeenCalledWith(DISPATCHED_REMINDER_1.reminderId);

    expect(mockMarkReminderAsQueued).toHaveBeenCalledTimes(1);
    expect(mockMarkReminderAsQueued).toHaveBeenCalledWith(DISPATCHED_REMINDER_2.reminderId);
  });

  it("skips reminders whose status is not in the enabled set", async () => {
    process.env.REMINDER_ENABLED_STATUSES = JSON.stringify([OrderStatusCodes.RECEIVED]);

    await lambdaHandler(mockEvent, {} as Context);

    expect(mockNotify).not.toHaveBeenCalled();
    expect(mockMarkReminderAsQueued).not.toHaveBeenCalled();
  });

  it("skips reminders with no matching event code in the configuration", async () => {
    process.env.REMINDER_INTERVAL_CONFIG = JSON.stringify({
      [OrderStatusCodes.DISPATCHED]: [
        { interval: 7, eventCode: NotifyEventCode.DispatchedInitialReminder },
      ],
    });

    await lambdaHandler(mockEvent, {} as Context);

    expect(mockNotify).toHaveBeenCalledTimes(1);
    expect(mockNotify.mock.calls[0][0]).toMatchObject({
      reminderId: DISPATCHED_REMINDER_1.reminderId,
      eventCode: NotifyEventCode.DispatchedInitialReminder,
    });
  });

  it("throws and re-throws when getScheduledReminders rejects", async () => {
    const error = new Error("DB connection failed");
    mockGetScheduledReminders.mockRejectedValueOnce(error);

    await expect(lambdaHandler(mockEvent, {} as Context)).rejects.toThrow("DB connection failed");
    expect(mockNotify).not.toHaveBeenCalled();
  });
});
