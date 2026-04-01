import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { OrderStatusService } from "../lib/db/order-status-db";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { AWSSQSClient } from "../lib/sqs/sqs-client";
import { retrieveMandatoryEnvVariable } from "../lib/utils/utils";

export interface Environment {
  orderStatusDb: OrderStatusService;
  sqsClient: AWSSQSClient;
  notifyMessagesQueueUrl: string;
}

export function buildEnvironment(): Environment {
  const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";
  const notifyMessagesQueueUrl = retrieveMandatoryEnvVariable("NOTIFY_MESSAGES_QUEUE_URL");
  const secretsClient = new AwsSecretsClient(awsRegion);
  const dbClient = new PostgresDbClient(postgresConfigFromEnv(secretsClient));
  const orderStatusDb = new OrderStatusService(dbClient);
  const sqsClient = new AWSSQSClient();

  return {
    orderStatusDb,
    sqsClient,
    notifyMessagesQueueUrl,
  };
}

let _env: Environment | undefined;

export function init(): Environment {
  _env ??= buildEnvironment();
  return _env;
}
