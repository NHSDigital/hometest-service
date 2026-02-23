import { PostgresDbClient } from "../lib/db/db-client";
import { AWSSQSClient } from "../lib/sqs/sqs-client";
import { retrieveMandatoryEnvVariable } from "../lib/utils/utils";
import { TransactionService } from "../lib/db/transaction-db-client";
import { OrderStatusService } from "../lib/db/order-status-db";

export interface Environment {
  orderStatusService: OrderStatusService;
  transactionService: TransactionService;
  sqsClient: AWSSQSClient;
  orderPlacementQueueUrl: string;
}

export function init(): Environment {
  const databaseUrl = retrieveMandatoryEnvVariable("DATABASE_URL");
  const orderPlacementQueueUrl = retrieveMandatoryEnvVariable(
    "ORDER_PLACEMENT_QUEUE_URL",
  );
  const dbClient = new PostgresDbClient(databaseUrl);
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
