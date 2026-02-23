import {Commons, ConsoleCommons} from "../lib/commons";
import {SupplierService} from "../lib/db/supplier-db";
import {LaLookupService} from "./la-lookup";
import {PostgresDbClient} from "../lib/db/db-client";


export interface Environment {
  commons: Commons;
  supplierDb: SupplierService;
  laLookupService: LaLookupService
}

export function init(): Environment {
  const commons = new ConsoleCommons();
  const dbClient = new PostgresDbClient(process.env.DATABASE_URL!);
  const supplierDb = new SupplierService({ dbClient });
  const laLookupService = new LaLookupService();

  return {
    commons,
    supplierDb,
    laLookupService
  };
}
