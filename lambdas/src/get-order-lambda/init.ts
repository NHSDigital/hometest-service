import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { OrderDbClient } from "../lib/db/order-db-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { retrieveMandatoryEnvVariable } from "../lib/utils/utils";

export interface Environment {
  orderDbClient: OrderDbClient;
}

export function buildEnvironment(): Environment {
  const awsRegion = retrieveMandatoryEnvVariable("AWS_REGION");
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
