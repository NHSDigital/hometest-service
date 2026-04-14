import { Context, EventBridgeEvent } from "aws-lambda";

import { ConsoleCommons } from "../lib/commons";
import { type ReminderScheduleTuple } from "../lib/db/order-status-reminder-db-client";
import { getReminderDispatchConfigFromEnv } from "./config";
import { init } from "./init";

const commons = new ConsoleCommons();
const name = "reminder-dispatch-lambda";

export const lambdaHandler = async (
  event: EventBridgeEvent<"ReminderDispatchEvent", unknown>,
  _context: Context,
): Promise<void> => {
  const { reminderNotifyService, orderStatusReminderDbClient } = init();
  const { enabledReminderStatuses, reminderConfiguration } = getReminderDispatchConfigFromEnv();
  const correlationId = event.id;

  try {
    commons.logInfo(name, "Reminder dispatch event received", {
      correlationId,
      source: event.source,
      detailType: event["detail-type"],
    });

    // cleanup stale rows HOTE-1136
    const schedules: ReminderScheduleTuple[] = Object.entries(reminderConfiguration).flatMap(
      ([triggerStatus, configs]) =>
        (configs ?? []).map((config, index) => ({
          triggerStatus,
          reminderNumber: index + 1,
          intervalDays: config.interval,
          eventCode: config.eventCode,
        })),
    );
    const reminders = await orderStatusReminderDbClient.getScheduledReminders(schedules);

    for (const reminder of reminders) {
      if (!enabledReminderStatuses.has(reminder.triggerStatus)) {
        commons.logInfo(name, "Reminder skipped for disabled trigger status", {
          correlationId,
          reminderId: reminder.reminderId,
          orderUid: reminder.orderUid,
          triggerStatus: reminder.triggerStatus,
        });
        continue;
      }

      const reminderEventCode = schedules.find(
        (s) =>
          s.triggerStatus === reminder.triggerStatus &&
          s.reminderNumber === reminder.reminderNumber,
      )?.eventCode;

      if (!reminderEventCode) {
        commons.logInfo(name, "No reminder event code configured", {
          correlationId,
          reminderId: reminder.reminderId,
          reminderNumber: reminder.reminderNumber,
        });
        continue;
      }

      try {
        await reminderNotifyService.dispatch({
          reminderId: reminder.reminderId,
          orderId: reminder.orderUid,
          correlationId,
          statusCode: reminder.triggerStatus,
          eventCode: reminderEventCode,
        });
      } catch (error) {
        commons.logError(name, "Failed to dispatch reminder", {
          correlationId,
          reminderId: reminder.reminderId,
          orderUid: reminder.orderUid,
          error,
        });
        await orderStatusReminderDbClient.markReminderAsFailed(reminder.reminderId);
        continue;
      }

      await orderStatusReminderDbClient.markReminderAsQueued(reminder.reminderId);

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
      }
    }

    commons.logInfo(name, "Reminder dispatch completed", {
      correlationId,
      processedCount: reminders.length,
    });
  } catch (error) {
    commons.logError(name, "Reminder dispatch failed", { correlationId, error });
    throw error;
  }
};

export const handler = lambdaHandler;
