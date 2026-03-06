import {Commons, ConsoleCommons} from "../lib/commons";
import {OrderService} from "../lib/db/order-db";
import {PostgresDbClient} from "../lib/db/db-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";

export interface Environment {
  commons: Commons;
  orderService: OrderService;
}

export function init(): Environment {
  const commons = new ConsoleCommons();
  const awsRegion =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";
  const secretsClient = new AwsSecretsClient(awsRegion);
  const dbClient = new PostgresDbClient(postgresConfigFromEnv(secretsClient));
  const orderService = new OrderService(dbClient, commons);

  return {
    commons,
    orderService,
  };
}
