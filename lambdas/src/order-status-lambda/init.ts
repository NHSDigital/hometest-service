import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { NotificationAuditDbClient } from "../lib/db/notification-audit-db-client";
import { OrderStatusService } from "../lib/db/order-status-db";
import { PatientDbClient } from "../lib/db/patient-db-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { AWSSQSClient } from "../lib/sqs/sqs-client";
import { retrieveMandatoryEnvVariable } from "../lib/utils/utils";
import { NotifyMessageBuilder } from "./notify-message-builder";

export interface Environment {
  orderStatusDb: OrderStatusService;
  patientDbClient: PatientDbClient;
  notificationAuditDbClient: NotificationAuditDbClient;
  sqsClient: AWSSQSClient;
  notifyMessageBuilder: NotifyMessageBuilder;
  notifyMessagesQueueUrl: string;
}

export function buildEnvironment(): Environment {
  const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";
  const notifyMessagesQueueUrl = retrieveMandatoryEnvVariable("NOTIFY_MESSAGES_QUEUE_URL");
  const homeTestBaseUrl = retrieveMandatoryEnvVariable("HOME_TEST_BASE_URL");
  const secretsClient = new AwsSecretsClient(awsRegion);
  const dbClient = new PostgresDbClient(postgresConfigFromEnv(secretsClient));
  const orderStatusDb = new OrderStatusService(dbClient);
  const patientDbClient = new PatientDbClient(dbClient);
  const notificationAuditDbClient = new NotificationAuditDbClient(dbClient);
  const sqsClient = new AWSSQSClient();
  const notifyMessageBuilder = new NotifyMessageBuilder(patientDbClient, homeTestBaseUrl);

  return {
    orderStatusDb,
    patientDbClient,
    notificationAuditDbClient,
    sqsClient,
    notifyMessageBuilder,
    notifyMessagesQueueUrl,
  };
}

let _env: Environment | undefined;

export function init(): Environment {
  _env ??= buildEnvironment();
  return _env;
}
