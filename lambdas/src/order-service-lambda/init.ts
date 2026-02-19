import { SupplierService } from "../lib/db/supplier-db";
import { PostgresDbClient } from "../lib/db/db-client";

export interface Environment {
  supplierService: SupplierService;
}

export function init(): Environment {
  const dbClient = new PostgresDbClient(process.env.DATABASE_URL!);
  const supplierService = new SupplierService({ dbClient });

  return {
    supplierService,
  };
}
