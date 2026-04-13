import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { OrderService } from "../lib/db/order-db";
import { ResultService } from "../lib/db/result-db";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";

export interface Environment {
  resultService: ResultService;
  orderService: OrderService;
}

export function buildEnvironment(): Environment {
  const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";
  const secretsClient = new AwsSecretsClient(awsRegion);
  const dbClient = new PostgresDbClient(postgresConfigFromEnv(secretsClient));
  const resultService = new ResultService(dbClient);
  const orderService = new OrderService(dbClient);

  return {
    resultService,
    orderService,
  };
}

let _env: Environment | undefined;

export function init(): Environment {
  _env ??= buildEnvironment();
  return _env;
}
