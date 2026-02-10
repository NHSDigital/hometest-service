import {Commons, ConsoleCommons} from "../lib/commons";
import {SupplierService} from "../lib/db/supplier-db";
import {LaLookupService} from "./la-lookup";
import {PostgresDbClient} from "../lib/db/db-client";
import {HttpClient} from "../lib/http/http-client";

export interface Environment {
  commons: Commons,
  supplierDb: SupplierService,
  /*laLookupService: LaLookupService*/
}

export function init(): Environment {
  const commons = new ConsoleCommons();
  const dbClient = new PostgresDbClient(process.env.DATABASE_URL!);
  const supplierDb = new SupplierService({dbClient}, commons);
  /*const laLookupService = new LaLookupService({baseUrl: process.env.LA_LOOKUP_URL!, httpClient}, commons);*/

  return {
    commons,
    supplierDb,
    /*laLookupService*/
  }
}
