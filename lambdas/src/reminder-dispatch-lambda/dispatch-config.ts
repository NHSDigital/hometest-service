import { type OrderStatusCode, OrderStatusCodes } from "../lib/db/order-status-db";
import { retrieveMandatoryEnvVariable } from "../lib/utils/utils";

const allOrderStatusCodes = new Set<OrderStatusCode>(Object.values(OrderStatusCodes));

export interface ReminderScheduleConfig {
  interval: number;
  eventCode: string;
}

export type ReminderConfiguration = Partial<Record<OrderStatusCode, ReminderScheduleConfig[]>>;

export interface ReminderDispatchConfig {
  enabledReminderStatuses: ReadonlySet<OrderStatusCode>;
  reminderConfiguration: ReminderConfiguration;
}

function isOrderStatusCode(value: string): value is OrderStatusCode {
  return allOrderStatusCodes.has(value as OrderStatusCode);
}

function parseEnabledReminderStatuses(rawValue: string): ReadonlySet<OrderStatusCode> {
  const parsed = JSON.parse(rawValue) as unknown;

  if (!Array.isArray(parsed)) {
    throw new TypeError("REMINDER_ENABLED_STATUSES must be a JSON array of order status strings");
  }

  const enabledStatuses = parsed.filter(
    (status): status is OrderStatusCode => typeof status === "string" && isOrderStatusCode(status),
  );

  if (enabledStatuses.length === 0) {
    throw new Error("REMINDER_ENABLED_STATUSES must contain at least one valid order status");
  }

  return new Set<OrderStatusCode>(enabledStatuses);
}

function parseReminderConfiguration(rawValue: string): ReminderConfiguration {
  const parsed = JSON.parse(rawValue) as unknown;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("REMINDER_INTERVAL_CONFIG must be a JSON object");
  }

  const result: ReminderConfiguration = {};

  for (const [status, schedules] of Object.entries(parsed)) {
    if (!isOrderStatusCode(status)) {
      continue;
    }

    if (!Array.isArray(schedules)) {
      continue;
    }

    const validSchedules = schedules
      .map((schedule): ReminderScheduleConfig | null => {
        if (!schedule || typeof schedule !== "object") {
          return null;
        }

        const rawInterval = (schedule as { interval?: unknown }).interval;
        const rawEventCode = (schedule as { eventCode?: unknown }).eventCode;

        if (typeof rawInterval !== "number" || !Number.isFinite(rawInterval) || rawInterval <= 0) {
          return null;
        }

        if (typeof rawEventCode !== "string" || !rawEventCode.trim()) {
          return null;
        }

        return {
          interval: rawInterval,
          eventCode: rawEventCode,
        };
      })
      .filter((schedule): schedule is ReminderScheduleConfig => schedule !== null);

    result[status] = validSchedules;
  }

  return result;
}

export function getReminderDispatchConfigFromEnv(): ReminderDispatchConfig {
  const enabledStatusesRaw = retrieveMandatoryEnvVariable("REMINDER_ENABLED_STATUSES");
  const reminderIntervalConfigRaw = retrieveMandatoryEnvVariable("REMINDER_INTERVAL_CONFIG");

  return {
    enabledReminderStatuses: parseEnabledReminderStatuses(enabledStatusesRaw),
    reminderConfiguration: parseReminderConfiguration(reminderIntervalConfigRaw),
  };
}
