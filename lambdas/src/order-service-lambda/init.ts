import { PostgresDbClient } from "../lib/db/db-client";
import { AWSSQSClient } from "../lib/sqs/sqs-client";
import { retrieveMandatoryEnvVariable } from "../lib/utils";
import { TransactionService } from "../lib/db/transaction-db-client";
import { OrderStatusService } from "../lib/db/order-status-db";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";

export interface Environment {
  orderStatusService: OrderStatusService;
  transactionService: TransactionService;
  sqsClient: AWSSQSClient;
  orderPlacementQueueUrl: string;
}

export function init(): Environment {
  const orderPlacementQueueUrl = retrieveMandatoryEnvVariable(
    "ORDER_PLACEMENT_QUEUE_URL",
  );
  const awsRegion =
    process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";
  const secretsClient = new AwsSecretsClient(awsRegion);
  const dbClient = new PostgresDbClient(postgresConfigFromEnv(secretsClient));
  const orderStatusService = new OrderStatusService(dbClient);
  const transactionService = new TransactionService({ dbClient });
  const sqsClient = new AWSSQSClient();

  return {
    orderStatusService,
    transactionService,
    sqsClient,
    orderPlacementQueueUrl,
  };
}
