import { Commons, ConsoleCommons } from "../lib/commons";
import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { NotificationAuditDbClient } from "../lib/db/notification-audit-db-client";
import { OrderService } from "../lib/db/order-db";
import { OrderStatusService } from "../lib/db/order-status-db";
import { PatientDbClient } from "../lib/db/patient-db-client";
import { NotifyMessageBuilder } from "../lib/notify/notify-message-builder";
import { OrderStatusNotifyService } from "../lib/notify/notify-service";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { AWSSQSClient } from "../lib/sqs/sqs-client";
import { retrieveMandatoryEnvVariable } from "../lib/utils/utils";

export interface Environment {
  commons: Commons;
  orderService: OrderService;
  orderStatusNotifyService: OrderStatusNotifyService;
}

export function buildEnvironment(): Environment {
  const commons = new ConsoleCommons();
  const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";
  const notifyMessagesQueueUrl = retrieveMandatoryEnvVariable("NOTIFY_MESSAGES_QUEUE_URL");
  const homeTestBaseUrl = retrieveMandatoryEnvVariable("HOME_TEST_BASE_URL");

  const secretsClient = new AwsSecretsClient(awsRegion);
  const dbClient = new PostgresDbClient(postgresConfigFromEnv(secretsClient));
  const orderService = new OrderService(dbClient, commons);
  const orderStatusDb = new OrderStatusService(dbClient);
  const patientDbClient = new PatientDbClient(dbClient);
  const notificationAuditDbClient = new NotificationAuditDbClient(dbClient);
  const sqsClient = new AWSSQSClient();
  const notifyMessageBuilder = new NotifyMessageBuilder(patientDbClient, homeTestBaseUrl);
  const orderStatusNotifyService = new OrderStatusNotifyService({
    orderStatusDb,
    notificationAuditDbClient,
    sqsClient,
    notifyMessageBuilder,
    notifyMessagesQueueUrl,
  });

  return {
    commons,
    orderService,
    orderStatusNotifyService,
  };
}

let _env: Environment | undefined;

export function init(): Environment {
  _env ??= buildEnvironment();
  return _env;
}
