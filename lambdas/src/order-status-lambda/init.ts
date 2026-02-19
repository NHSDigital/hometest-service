import { PostgresDbClient } from "../lib/db/db-client";
import { OrderStatusService } from "../lib/db/order-status-db";
import { retrieveMandatoryEnvVariable } from "../lib/utils";

export interface EnvironmentVariables {
  DATABASE_URL: string;
}

export interface Dependencies {
  orderStatusDb: OrderStatusService;
  environmentVariables: EnvironmentVariables;
}

export function init(): Dependencies {
  const databaseUrl = retrieveMandatoryEnvVariable("DATABASE_URL");

  const dbClient = new PostgresDbClient(databaseUrl);
  const orderStatusDb = new OrderStatusService(dbClient);

  return {
    orderStatusDb,
    environmentVariables: {
      DATABASE_URL: databaseUrl,
    },
  };
}
