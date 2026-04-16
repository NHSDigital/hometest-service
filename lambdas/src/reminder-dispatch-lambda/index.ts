import { Context, EventBridgeEvent } from "aws-lambda";

import { ConsoleCommons } from "../lib/commons";
import { type OrderStatusCode } from "../lib/db/order-status-db";
import { type MarkReminderAsFailedCommand } from "./db/commands/mark-reminder-as-failed";
import { type MarkReminderAsQueuedCommand } from "./db/commands/mark-reminder-as-queued";
import { type ScheduleReminderCommand } from "./db/commands/schedule-reminder";
import { type OrderStatusReminderRecord, type ReminderScheduleTuple } from "./db/types";
import { type ReminderConfiguration } from "./dispatch-config";
import { init } from "./init";
import { type ReminderNotifyService } from "./notify/reminder-notify-service";

const commons = new ConsoleCommons();
const name = "reminder-dispatch-lambda";

interface ProcessReminderDeps {
  reminderNotifyService: ReminderNotifyService;
  markReminderAsQueuedCommand: MarkReminderAsQueuedCommand;
  markReminderAsFailedCommand: MarkReminderAsFailedCommand;
  scheduleReminderCommand: ScheduleReminderCommand;
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
    markReminderAsQueuedCommand,
    markReminderAsFailedCommand,
    scheduleReminderCommand,
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
    try {
      await markReminderAsFailedCommand.execute(reminder.reminderId);
    } catch (dbError) {
      commons.logError(name, "Failed to mark reminder as failed", {
        ...logContext,
        error: dbError,
      });
    }
    return "failed";
  }

  try {
    await markReminderAsQueuedCommand.execute(reminder.reminderId);
  } catch (dbError) {
    commons.logError(name, "Failed to mark reminder as queued", { ...logContext, error: dbError });
    return "failed";
  }
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
    try {
      await scheduleReminderCommand.execute(
        reminder.orderUid,
        reminder.triggerStatus,
        nextSchedule.reminderNumber,
        reminder.triggeredAt,
      );
      commons.logInfo(name, "Next reminder scheduled", {
        ...logContext,
        reminderNumber: nextSchedule.reminderNumber,
      });
    } catch (dbError) {
      commons.logError(name, "Failed to schedule next reminder", { ...logContext, error: dbError });
    }
  }

  return "dispatched";
}

export const lambdaHandler = async (
  event: EventBridgeEvent<"ReminderDispatchEvent", unknown>,
  _context: Context,
): Promise<void> => {
  const {
    reminderNotifyService,
    getScheduledRemindersQuery,
    markReminderAsQueuedCommand,
    markReminderAsFailedCommand,
    scheduleReminderCommand,
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
    const reminders = await getScheduledRemindersQuery.execute(schedules);

    const settledOutcomes = await Promise.allSettled(
      reminders.map((reminder) =>
        processReminder(reminder, {
          reminderNotifyService,
          markReminderAsQueuedCommand,
          markReminderAsFailedCommand,
          scheduleReminderCommand,
          schedules,
          enabledReminderStatuses,
          correlationId,
        }),
      ),
    );
    const outcomes: ReminderOutcome[] = settledOutcomes.map((result) => {
      if (result.status === "rejected") {
        commons.logError(name, "Reminder processing threw unexpectedly", {
          correlationId,
          error: result.reason,
        });
        return "failed";
      }
      return result.value;
    });

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
