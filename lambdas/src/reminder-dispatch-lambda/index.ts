import { Context, EventBridgeEvent } from "aws-lambda";

import { ConsoleCommons } from "../lib/commons";
import { type OrderStatusCode } from "../lib/db/order-status-db";
import {
  type OrderStatusReminderDbClient,
  type OrderStatusReminderRecord,
  type ReminderScheduleTuple,
} from "../lib/db/order-status-reminder-db-client";
import { type ReminderNotifyService } from "../lib/notify/services/reminder-notify-service";
import { type ReminderConfiguration } from "./dispatch-config";
import { init } from "./init";

const commons = new ConsoleCommons();
const name = "reminder-dispatch-lambda";

interface ProcessReminderDeps {
  reminderNotifyService: ReminderNotifyService;
  orderStatusReminderDbClient: OrderStatusReminderDbClient;
  schedules: ReminderScheduleTuple[];
  enabledReminderStatuses: ReadonlySet<OrderStatusCode>;
  correlationId: string;
}

type ReminderOutcome = "dispatched" | "skipped_disabled" | "skipped_no_config" | "failed";

function buildSchedules(reminderConfiguration: ReminderConfiguration): ReminderScheduleTuple[] {
  return Object.entries(reminderConfiguration).flatMap(([triggerStatus, configs]) =>
    (configs ?? []).map((config, index) => ({
      triggerStatus,
      reminderNumber: index + 1,
      intervalDays: config.interval,
      eventCode: config.eventCode,
    })),
  );
}

async function processReminder(
  reminder: OrderStatusReminderRecord,
  deps: ProcessReminderDeps,
): Promise<ReminderOutcome> {
  const {
    reminderNotifyService,
    orderStatusReminderDbClient,
    schedules,
    enabledReminderStatuses,
    correlationId,
  } = deps;
  const logContext = {
    correlationId,
    reminderId: reminder.reminderId,
    orderUid: reminder.orderUid,
    triggerStatus: reminder.triggerStatus,
    reminderNumber: reminder.reminderNumber,
  };

  if (!enabledReminderStatuses.has(reminder.triggerStatus)) {
    commons.logInfo(name, "Reminder skipped for disabled trigger status", logContext);
    return "skipped_disabled";
  }

  const reminderEventCode = schedules.find(
    (s) =>
      s.triggerStatus === reminder.triggerStatus && s.reminderNumber === reminder.reminderNumber,
  )?.eventCode;

  if (!reminderEventCode) {
    commons.logInfo(name, "No reminder event code configured", logContext);
    return "skipped_no_config";
  }

  commons.logInfo(name, "Processing reminder", logContext);

  try {
    await reminderNotifyService.dispatch({
      reminderId: reminder.reminderId,
      orderId: reminder.orderUid,
      correlationId,
      statusCode: reminder.triggerStatus,
      eventCode: reminderEventCode,
    });
  } catch (error) {
    commons.logError(name, "Failed to dispatch reminder", { ...logContext, error });
    await orderStatusReminderDbClient.markReminderAsFailed(reminder.reminderId);
    return "failed";
  }

  await orderStatusReminderDbClient.markReminderAsQueued(reminder.reminderId);
  commons.logInfo(name, "Reminder dispatched successfully", {
    ...logContext,
    eventCode: reminderEventCode,
  });

  const nextSchedule = schedules.find(
    (s) =>
      s.triggerStatus === reminder.triggerStatus &&
      s.reminderNumber === reminder.reminderNumber + 1,
  );

  if (nextSchedule) {
    await orderStatusReminderDbClient.scheduleReminder(
      reminder.orderUid,
      reminder.triggerStatus,
      nextSchedule.reminderNumber,
      reminder.triggeredAt,
    );
    commons.logInfo(name, "Next reminder scheduled", {
      ...logContext,
      reminderNumber: nextSchedule.reminderNumber,
    });
  }

  return "dispatched";
}

export const lambdaHandler = async (
  event: EventBridgeEvent<"ReminderDispatchEvent", unknown>,
  _context: Context,
): Promise<void> => {
  const {
    reminderNotifyService,
    orderStatusReminderDbClient,
    enabledReminderStatuses,
    reminderConfiguration,
  } = init();

  const correlationId = event.id;

  try {
    commons.logInfo(name, "Reminder dispatch event received", {
      correlationId,
      source: event.source,
      detailType: event["detail-type"],
    });

    // cleanup stale rows HOTE-1136
    const schedules = buildSchedules(reminderConfiguration);
    const reminders = await orderStatusReminderDbClient.getScheduledReminders(schedules);

    const outcomes: ReminderOutcome[] = [];
    for (const reminder of reminders) {
      outcomes.push(
        await processReminder(reminder, {
          reminderNotifyService,
          orderStatusReminderDbClient,
          schedules,
          enabledReminderStatuses,
          correlationId,
        }),
      );
    }

    const countFunc = (outcome: ReminderOutcome) => outcomes.filter((o) => o === outcome).length;

    commons.logInfo(name, "Reminder dispatch completed", {
      correlationId,
      totalCount: reminders.length,
      dispatchedCount: countFunc("dispatched"),
      failedCount: countFunc("failed"),
      skippedDisabledCount: countFunc("skipped_disabled"),
      skippedNoConfigCount: countFunc("skipped_no_config"),
    });
  } catch (error) {
    commons.logError(name, "Reminder dispatch failed", { correlationId, error });
    throw error;
  }
};

export const handler = lambdaHandler;
