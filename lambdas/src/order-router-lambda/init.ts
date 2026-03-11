import { FetchHttpClient } from "../lib/http/http-client";
import { SupplierService } from "../lib/db/supplier-db";
import { PostgresDbClient } from "../lib/db/db-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { OrderStatusService } from "../lib/db/order-status-db";

export interface Environment {
  httpClient: FetchHttpClient;
  supplierDb: SupplierService;
  secretsClient: AwsSecretsClient;
  orderStatusService: OrderStatusService;
}

export function init(): Environment {
  const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";

  const httpClient = new FetchHttpClient();
  const secretsClient = new AwsSecretsClient(awsRegion);
  const dbClient = new PostgresDbClient(postgresConfigFromEnv(secretsClient));
  const supplierDb = new SupplierService({ dbClient });
  const orderStatusService = new OrderStatusService(dbClient);

  return {
    httpClient,
    supplierDb,
    secretsClient,
    orderStatusService,
  };
}
