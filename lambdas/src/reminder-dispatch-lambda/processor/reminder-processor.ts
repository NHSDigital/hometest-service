import { ConsoleCommons } from "../../lib/commons";
import { type OrderStatusCode } from "../../lib/db/order-status-db";
import { type MarkReminderAsFailedCommand } from "../db/commands/mark-reminder-as-failed";
import { type MarkReminderAsQueuedCommand } from "../db/commands/mark-reminder-as-queued";
import { type ScheduleReminderCommand } from "../db/commands/schedule-reminder";
import { type OrderStatusReminderRecord } from "../db/types";
import { type ReminderNotifyService } from "../notify/reminder-notify-service";
import { type ReminderSchedule } from "./schedules";

export type ReminderProcessorOutcome =
  | "dispatched"
  | "skipped_disabled"
  | "skipped_no_config"
  | "failed";

export interface ReminderProcessorDeps {
  reminderNotifyService: ReminderNotifyService;
  markReminderAsQueuedCommand: MarkReminderAsQueuedCommand;
  markReminderAsFailedCommand: MarkReminderAsFailedCommand;
  scheduleReminderCommand: ScheduleReminderCommand;
}

export interface ReminderProcessorContext {
  schedules: ReminderSchedule[];
  enabledReminderStatuses: ReadonlySet<OrderStatusCode>;
  correlationId: string;
}

const commons = new ConsoleCommons();
const name = "reminder-dispatch-lambda";

export class ReminderProcessor {
  private readonly reminderNotifyService: ReminderNotifyService;
  private readonly markReminderAsQueuedCommand: MarkReminderAsQueuedCommand;
  private readonly markReminderAsFailedCommand: MarkReminderAsFailedCommand;
  private readonly scheduleReminderCommand: ScheduleReminderCommand;

  constructor(deps: ReminderProcessorDeps) {
    this.reminderNotifyService = deps.reminderNotifyService;
    this.markReminderAsQueuedCommand = deps.markReminderAsQueuedCommand;
    this.markReminderAsFailedCommand = deps.markReminderAsFailedCommand;
    this.scheduleReminderCommand = deps.scheduleReminderCommand;
  }

  async process(
    reminder: OrderStatusReminderRecord,
    context: ReminderProcessorContext,
  ): Promise<ReminderProcessorOutcome> {
    const { schedules, enabledReminderStatuses, correlationId } = context;
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
      await this.reminderNotifyService.dispatch({
        reminderId: reminder.reminderId,
        orderId: reminder.orderUid,
        correlationId,
        statusCode: reminder.triggerStatus,
        eventCode: reminderEventCode,
      });
    } catch (error) {
      commons.logError(name, "Failed to dispatch reminder", { ...logContext, error });
      try {
        await this.markReminderAsFailedCommand.execute(reminder.reminderId);
      } catch (dbError) {
        commons.logError(name, "Failed to mark reminder as failed", {
          ...logContext,
          error: dbError,
        });
      }
      return "failed";
    }

    try {
      await this.markReminderAsQueuedCommand.execute(reminder.reminderId);
    } catch (dbError) {
      commons.logError(name, "Failed to mark reminder as queued", {
        ...logContext,
        error: dbError,
      });
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
        await this.scheduleReminderCommand.execute(
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
        commons.logError(name, "Failed to schedule next reminder", {
          ...logContext,
          error: dbError,
        });
      }
    }

    return "dispatched";
  }
}
