import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { NotificationAuditDbClient } from "../lib/db/notification-audit-db-client";
import { OrderDbClient } from "../lib/db/order-db-client";
import { OrderStatusCodes, OrderStatusService } from "../lib/db/order-status-db";
import { OrderStatusReminderDbClient } from "../lib/db/order-status-reminder-db-client";
import { PatientDbClient } from "../lib/db/patient-db-client";
import { DispatchedReminderMessageBuilder } from "../lib/notify/message-builders/reminder/dispatched-reminder-message-builder";
import { ReminderNotifyService } from "../lib/notify/services/reminder-notify-service";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { AWSSQSClient } from "../lib/sqs/sqs-client";
import { retrieveMandatoryEnvVariable } from "../lib/utils/utils";

export interface Environment {
  reminderNotifyService: ReminderNotifyService;
  orderStatusReminderDbClient: OrderStatusReminderDbClient;
}

export function buildEnvironment(): Environment {
  const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";
  const notifyMessagesQueueUrl = retrieveMandatoryEnvVariable("NOTIFY_MESSAGES_QUEUE_URL");
  const homeTestBaseUrl = retrieveMandatoryEnvVariable("HOME_TEST_BASE_URL");

  const secretsClient = new AwsSecretsClient(awsRegion);
  const dbClient = new PostgresDbClient(postgresConfigFromEnv(secretsClient));
  const orderStatusDb = new OrderStatusService(dbClient);
  const orderStatusReminderDbClient = new OrderStatusReminderDbClient(dbClient);
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

  return {
    reminderNotifyService,
    orderStatusReminderDbClient,
  };
}

let _env: Environment | undefined;

export function init(): Environment {
  _env ??= buildEnvironment();
  return _env;
}
