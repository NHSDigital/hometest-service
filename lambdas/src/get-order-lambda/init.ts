import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { OrderDbClient } from "../lib/db/order-db-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";

export interface Environment {
  orderDbClient: OrderDbClient;
}

export function buildEnvironment(): Environment {
  const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";
  const secretsClient = new AwsSecretsClient(awsRegion);

  const dbClient = new PostgresDbClient(postgresConfigFromEnv(secretsClient));
  const orderDbClient = new OrderDbClient(dbClient);

  return {
    orderDbClient,
  };
}

let _env: Environment | undefined;

export function init(): Environment {
  _env ??= buildEnvironment();
  return _env;
}
