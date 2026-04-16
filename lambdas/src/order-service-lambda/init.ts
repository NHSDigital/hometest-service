import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { OrderStatusService } from "../lib/db/order-status-db";
import { TransactionService } from "../lib/db/transaction-db-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { AWSSQSClient } from "../lib/sqs/sqs-client";
import { retrieveMandatoryEnvVariable, retrieveOptionalEnvVariable } from "../lib/utils/utils";

export interface Environment {
  orderStatusService: OrderStatusService;
  transactionService: TransactionService;
  sqsClient: AWSSQSClient;
  orderPlacementQueueUrl: string;
}

export function buildEnvironment(): Environment {
  const orderPlacementQueueUrl = retrieveMandatoryEnvVariable("ORDER_PLACEMENT_QUEUE_URL");
  const awsRegion = retrieveMandatoryEnvVariable("AWS_REGION");
  const sqsEndpoint = retrieveOptionalEnvVariable("SQS_ENDPOINT");
  const secretsClient = new AwsSecretsClient(awsRegion);
  const dbClient = new PostgresDbClient(postgresConfigFromEnv(secretsClient));
  const orderStatusService = new OrderStatusService(dbClient);
  const transactionService = new TransactionService({ dbClient });
  const sqsClient = new AWSSQSClient(awsRegion, sqsEndpoint);

  return {
    orderStatusService,
    transactionService,
    sqsClient,
    orderPlacementQueueUrl,
  };
}

let _env: Environment | undefined;

export function init(): Environment {
  _env ??= buildEnvironment();
  return _env;
}
