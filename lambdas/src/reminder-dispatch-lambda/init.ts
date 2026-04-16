import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { NotificationAuditDbClient } from "../lib/db/notification-audit-db-client";
import { OrderDbClient } from "../lib/db/order-db-client";
import {
  type OrderStatusCode,
  OrderStatusCodes,
  OrderStatusService,
} from "../lib/db/order-status-db";
import { PatientDbClient } from "../lib/db/patient-db-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { AWSSQSClient } from "../lib/sqs/sqs-client";
import { retrieveMandatoryEnvVariable } from "../lib/utils/utils";
import { MarkReminderAsFailedCommand } from "./db/commands/mark-reminder-as-failed";
import { MarkReminderAsQueuedCommand } from "./db/commands/mark-reminder-as-queued";
import { ScheduleReminderCommand } from "./db/commands/schedule-reminder";
import { GetScheduledRemindersQuery } from "./db/queries/get-scheduled-reminders";
import { type ReminderConfiguration, getReminderDispatchConfigFromEnv } from "./dispatch-config";
import { DispatchedReminderMessageBuilder } from "./notify/dispatched-reminder-message-builder";
import { ReminderNotifyService } from "./notify/reminder-notify-service";

export interface Environment {
  reminderNotifyService: ReminderNotifyService;
  getScheduledRemindersQuery: GetScheduledRemindersQuery;
  markReminderAsQueuedCommand: MarkReminderAsQueuedCommand;
  markReminderAsFailedCommand: MarkReminderAsFailedCommand;
  scheduleReminderCommand: ScheduleReminderCommand;
  enabledReminderStatuses: ReadonlySet<OrderStatusCode>;
  reminderConfiguration: ReminderConfiguration;
}

export function buildEnvironment(): Environment {
  const awsRegion = retrieveMandatoryEnvVariable("AWS_REGION");
  const notifyMessagesQueueUrl = retrieveMandatoryEnvVariable("NOTIFY_MESSAGES_QUEUE_URL");
  const homeTestBaseUrl = retrieveMandatoryEnvVariable("HOME_TEST_BASE_URL");

  const secretsClient = new AwsSecretsClient(awsRegion);
  const dbClient = new PostgresDbClient(postgresConfigFromEnv(secretsClient));
  const orderStatusDb = new OrderStatusService(dbClient);
  const getScheduledRemindersQuery = new GetScheduledRemindersQuery(dbClient);
  const markReminderAsQueuedCommand = new MarkReminderAsQueuedCommand(dbClient);
  const markReminderAsFailedCommand = new MarkReminderAsFailedCommand(dbClient);
  const scheduleReminderCommand = new ScheduleReminderCommand(dbClient);
  const patientDbClient = new PatientDbClient(dbClient);
  const orderDbClient = new OrderDbClient(dbClient);
  const notificationAuditDbClient = new NotificationAuditDbClient(dbClient);
  const sqsClient = new AWSSQSClient(awsRegion);
  const builderDeps = { patientDbClient, orderDbClient, homeTestBaseUrl };
  const reminderNotifyService = new ReminderNotifyService({
    notifyMessageBuilders: {
      [OrderStatusCodes.DISPATCHED]: new DispatchedReminderMessageBuilder(
        builderDeps,
        orderStatusDb,
      ),
    },
    orderStatusService: orderStatusDb,
    notificationAuditDbClient,
    sqsClient,
    notifyMessagesQueueUrl,
  });

  const { enabledReminderStatuses, reminderConfiguration } = getReminderDispatchConfigFromEnv();

  return {
    reminderNotifyService,
    getScheduledRemindersQuery,
    markReminderAsQueuedCommand,
    markReminderAsFailedCommand,
    scheduleReminderCommand,
    enabledReminderStatuses,
    reminderConfiguration,
  };
}

let _env: Environment | undefined;

export function init(): Environment {
  _env ??= buildEnvironment();
  return _env;
}
