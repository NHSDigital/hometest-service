import { SupplierService } from "../lib/db/supplier-db";
import { PostgresDbClient } from "../lib/db/db-client";
import { AWSSQSClient } from "../lib/sqs/sqs-client";
import { retrieveMandatoryEnvVariable } from "../lib/utils";

export interface Environment {
  supplierService: SupplierService;
  sqsClient: AWSSQSClient;
  orderPlacementQueueUrl: string;
}

export function init(): Environment {
  const databaseUrl = retrieveMandatoryEnvVariable("DATABASE_URL");
  const orderPlacementQueueUrl = retrieveMandatoryEnvVariable(
    "ORDER_PLACEMENT_QUEUE_URL",
  );
  const dbClient = new PostgresDbClient(databaseUrl);
  const supplierService = new SupplierService({ dbClient });
  const sqsClient = new AWSSQSClient();

  return {
    supplierService,
    sqsClient,
    orderPlacementQueueUrl,
  };
}
