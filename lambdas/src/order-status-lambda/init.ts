import { postgresConfigFromEnv } from "../lib/db/db-config";
import { PostgresDbClient } from "../lib/db/db-client";
import { OrderStatusService } from "../lib/db/order-status-db";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";

export interface Dependencies {
  orderStatusDb: OrderStatusService;
}

export function init(): Dependencies {
  const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";
  const secretsClient = new AwsSecretsClient(awsRegion);
  const dbClient = new PostgresDbClient(postgresConfigFromEnv(secretsClient));
  const orderStatusDb = new OrderStatusService(dbClient);

  return {
    orderStatusDb,
  };
}
