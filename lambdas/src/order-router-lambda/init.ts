import { Commons, ConsoleCommons } from "../lib/commons";
import { SupplierService } from "../lib/db/supplier-db";
import { PostgresDbClient } from "../lib/db/db-client";
import { FetchHttpClient } from "../lib/http/http-client";

export interface Environment {
  commons: Commons;
  supplierDb: SupplierService;
  httpClient: FetchHttpClient;
}

export function init(): Environment {
  const commons = new ConsoleCommons();
  const dbClient = new PostgresDbClient(process.env.DATABASE_URL!);
  const httpClient = new FetchHttpClient();
  const supplierDb = new SupplierService({ dbClient }, commons);

  return {
    commons,
    supplierDb,
    httpClient,
  };
}
