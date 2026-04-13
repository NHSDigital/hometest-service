import { Context, EventBridgeEvent } from "aws-lambda";

import { ConsoleCommons } from "../lib/commons";
import { type OrderStatusReminderRecord } from "../lib/db/order-status-reminder-db-client";
import { type ReminderConfiguration, getReminderDispatchConfigFromEnv } from "./config";
import { init } from "./init";

const commons = new ConsoleCommons();
const name = "reminder-dispatch-lambda";

function getReminderEventCode(
  reminder: OrderStatusReminderRecord,
  reminderConfiguration: ReminderConfiguration,
): string | undefined {
  const schedules = reminderConfiguration[reminder.statusCode];

  if (!schedules || schedules.length === 0) {
    return undefined;
  }

  return schedules[reminder.reminderNumber - 1]?.eventCode;
}

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
    // todo implement proper database method need HOTE-1125
    const reminders = await orderStatusReminderDbClient.getPendingReminders();

    for (const reminder of reminders) {
      if (!enabledReminderStatuses.has(reminder.statusCode)) {
        commons.logInfo(name, "Reminder skipped for disabled trigger status", {
          correlationId,
          reminderId: reminder.reminderId,
          orderUid: reminder.orderUid,
          statusCode: reminder.statusCode,
        });
        continue;
      }

      const reminderEventCode = getReminderEventCode(reminder, reminderConfiguration);

      if (!reminderEventCode) {
        commons.logInfo(name, "No reminder event code configured", {
          correlationId,
          reminderId: reminder.reminderId,
          reminderNumber: reminder.reminderNumber,
        });
        continue;
      }

      await reminderNotifyService.dispatch({
        reminderId: reminder.reminderId,
        orderId: reminder.orderUid,
        correlationId,
        statusCode: reminder.statusCode,
        eventCode: reminderEventCode,
      });

      // todo update reminder status

      // todo insert next reminder all base on original dispatch if have next series

      // todo mark reminder on failed
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
