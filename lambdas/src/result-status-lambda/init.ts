import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { OrderService } from "../lib/db/order-db";
import { OrderStatusService } from "../lib/db/order-status-db";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";

export interface Environment {
  orderService: OrderService;
  orderStatusService: OrderStatusService;
}

export function buildEnvironment(): Environment {
  const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";
  const secretsClient = new AwsSecretsClient(awsRegion);
  const dbClient = new PostgresDbClient(postgresConfigFromEnv(secretsClient));
  const orderService = new OrderService(dbClient);
  const orderStatusService = new OrderStatusService(dbClient);

  return {
    orderService,
    orderStatusService,
  };
}

let _env: Environment | undefined;

export function init(): Environment {
  _env ??= buildEnvironment();
  return _env;
}
