import { Commons, ConsoleCommons } from "../lib/commons";
import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { OrderService } from "../lib/db/order-db";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";

export interface Environment {
  commons: Commons;
  orderService: OrderService;
}

export function buildEnvironment(): Environment {
  const commons = new ConsoleCommons();
  const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";
  const secretsClient = new AwsSecretsClient(awsRegion);
  const dbClient = new PostgresDbClient(postgresConfigFromEnv(secretsClient));
  const orderService = new OrderService(dbClient, commons);

  return {
    commons,
    orderService,
  };
}

let _env: Environment | undefined;

export function init(): Environment {
  _env ??= buildEnvironment();
  return _env;
}
