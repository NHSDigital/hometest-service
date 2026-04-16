import { type NotifyEventCode } from "../../lib/types/notify-message";
import { type ReminderConfiguration } from "../config/dispatch-config";

export interface ReminderSchedule {
  triggerStatus: string;
  reminderNumber: number;
  intervalDays: number;
  eventCode: NotifyEventCode;
}

export function buildSchedules(reminderConfiguration: ReminderConfiguration): ReminderSchedule[] {
  return Object.entries(reminderConfiguration).flatMap(([triggerStatus, configs]) =>
    (configs ?? []).map((config, index) => ({
      triggerStatus,
      reminderNumber: index + 1,
      intervalDays: config.interval,
      eventCode: config.eventCode,
    })),
  );
}
