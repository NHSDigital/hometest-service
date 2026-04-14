import { Commons, ConsoleCommons } from "../lib/commons";
import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { NotificationAuditDbClient } from "../lib/db/notification-audit-db-client";
import { OrderService } from "../lib/db/order-db";
import { OrderDbClient } from "../lib/db/order-db-client";
import { OrderStatusCodes, OrderStatusService } from "../lib/db/order-status-db";
import { PatientDbClient } from "../lib/db/patient-db-client";
import { OrderDispatchedMessageBuilder } from "../lib/notify/message-builders/order-status/order-dispatched-message-builder";
import { OrderReceivedMessageBuilder } from "../lib/notify/message-builders/order-status/order-received-message-builder";
import { OrderResultAvailableMessageBuilder } from "../lib/notify/message-builders/order-status/order-result-available-message-builder";
import { OrderStatusNotifyService } from "../lib/notify/services/order-status-notify-service";
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
  const awsRegion = retrieveMandatoryEnvVariable("AWS_REGION");
  const notifyMessagesQueueUrl = retrieveMandatoryEnvVariable("NOTIFY_MESSAGES_QUEUE_URL");
  const homeTestBaseUrl = retrieveMandatoryEnvVariable("HOME_TEST_BASE_URL");
  const secretsClient = new AwsSecretsClient(awsRegion);
  const dbClient = new PostgresDbClient(postgresConfigFromEnv(secretsClient));
  const orderService = new OrderService(dbClient, commons);
  const orderStatusDb = new OrderStatusService(dbClient);
  const patientDbClient = new PatientDbClient(dbClient);
  const orderDbClient = new OrderDbClient(dbClient);
  const notificationAuditDbClient = new NotificationAuditDbClient(dbClient);
  const sqsClient = new AWSSQSClient(awsRegion);
  const builderDeps = { patientDbClient, orderDbClient, homeTestBaseUrl };
  const orderStatusNotifyService = new OrderStatusNotifyService({
    notifyMessageBuilders: {
      [OrderStatusCodes.DISPATCHED]: new OrderDispatchedMessageBuilder(builderDeps, orderStatusDb),
      [OrderStatusCodes.RECEIVED]: new OrderReceivedMessageBuilder(builderDeps, orderStatusDb),
      [OrderStatusCodes.COMPLETE]: new OrderResultAvailableMessageBuilder(builderDeps),
    },
    notificationAuditDbClient,
    sqsClient,
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
