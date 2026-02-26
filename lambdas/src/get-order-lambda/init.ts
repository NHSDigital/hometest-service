import { OrderDbClient } from "../lib/db/order-db-client";
import { PostgresDbClient } from "../lib/db/db-client";
import { postgresFromUrl } from "../lib/db/connection-string-provider";
import { retrieveOptionalEnvVariable } from "../lib/utils";

export interface Environment {
  orderDbClient: OrderDbClient;
}

export function init(): Environment {
  const databaseUrl = process.env.DATABASE_URL!;
  const sslEnabled = retrieveOptionalEnvVariable("DB_SSL", "true") === "true";

  const dbClient = new PostgresDbClient(postgresFromUrl(databaseUrl), {
    enabled: sslEnabled,
    rejectUnauthorized: sslEnabled,
  });
  const orderDbClient = new OrderDbClient(dbClient);

  return {
    orderDbClient,
  };
}
