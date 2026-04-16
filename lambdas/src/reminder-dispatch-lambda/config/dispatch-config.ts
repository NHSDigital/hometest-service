import { z } from "zod";

import { type OrderStatusCode, OrderStatusCodes } from "../../lib/db/order-status-db";
import { NotifyEventCode } from "../../lib/types/notify-message";
import { retrieveMandatoryEnvVariable } from "../../lib/utils/utils";

const REMINDER_ENABLED_STATUSES = "REMINDER_ENABLED_STATUSES";
const REMINDER_INTERVAL_CONFIG = "REMINDER_INTERVAL_CONFIG";

export interface ReminderScheduleConfig {
  interval: number;
  eventCode: NotifyEventCode;
}

export type ReminderConfiguration = Partial<Record<OrderStatusCode, ReminderScheduleConfig[]>>;

export interface ReminderDispatchConfig {
  enabledReminderStatuses: ReadonlySet<OrderStatusCode>;
  reminderConfiguration: ReminderConfiguration;
}

const EnabledReminderStatusesSchema = z
  .array(
    z.enum(OrderStatusCodes, {
      error: (issue) => `"${String(issue.input)}" is not a valid order status code`,
    }),
    {
      error: (issue) =>
        `${REMINDER_ENABLED_STATUSES} must be a JSON array of order status strings: ${String(issue.input)}`,
    },
  )
  .min(1, { error: `${REMINDER_ENABLED_STATUSES} must contain at least one valid order status` })
  .transform((codes) => new Set<OrderStatusCode>(codes));

const ReminderScheduleConfigSchema = z.object({
  interval: z
    .number({ error: (issue) => `interval must be a number, received: ${String(issue.input)}` })
    .positive({
      error: (issue) => `interval must be a positive number, received: ${String(issue.input)}`,
    })
    .gte(1, { error: (issue) => `interval must be >= 1, received: ${String(issue.input)}` }),
  eventCode: z.enum(NotifyEventCode, {
    error: (issue) =>
      `eventCode must be a valid NotifyEventCode, received: "${String(issue.input)}"`,
  }),
});

const ReminderConfigurationSchema = z
  .record(z.string(), z.unknown(), {
    error: () => `${REMINDER_INTERVAL_CONFIG} must be a JSON object`,
  })
  .pipe(z.partialRecord(z.enum(OrderStatusCodes), z.array(ReminderScheduleConfigSchema)));

function parseEnabledReminderStatuses(rawValue: string): ReadonlySet<OrderStatusCode> {
  const parsed = JSON.parse(rawValue) as unknown;
  return EnabledReminderStatusesSchema.parse(parsed);
}

function parseReminderConfiguration(rawValue: string): ReminderConfiguration {
  const parsed = JSON.parse(rawValue) as unknown;
  return ReminderConfigurationSchema.parse(parsed) as ReminderConfiguration;
}

export function getReminderDispatchConfigFromEnv(): ReminderDispatchConfig {
  const enabledStatusesRaw = retrieveMandatoryEnvVariable(REMINDER_ENABLED_STATUSES);
  const reminderIntervalConfigRaw = retrieveMandatoryEnvVariable(REMINDER_INTERVAL_CONFIG);

  return {
    enabledReminderStatuses: parseEnabledReminderStatuses(enabledStatusesRaw),
    reminderConfiguration: parseReminderConfiguration(reminderIntervalConfigRaw),
  };
}
