import { OrderDbClient } from "../lib/db/db-clients/order-db-client";
import { PostgresDbClient } from "../lib/db/db-client";

export interface Environment {
  orderDbClient: OrderDbClient;
}

export function init(): Environment {
  const databaseUrl = process.env.DATABASE_URL!;

  const dbClient = new PostgresDbClient(databaseUrl);
  const orderDbClient = new OrderDbClient(dbClient);

  return {
    orderDbClient,
  };
}
