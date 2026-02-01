import {Commons, ConsoleCommons} from "../../lambdas/src/lib/commons";
import {SupplierService} from "../../lambdas/src/lib/db/supplier-db";
import {LaLookupService} from "./la-lookup";
import {PostgresDbClient} from "../../lambdas/src/lib/db/db-client";
import {FetchHttpClient} from "../../lambdas/src/lib/http/http-client";

export interface Environment {
  commons: Commons,
  supplierDb: SupplierService,
  /*laLookupService: LaLookupService*/
}

export function init(): Environment {
  const commons = new ConsoleCommons();
  const dbClient = new PostgresDbClient(process.env.DATABASE_URL!);
  const httpClient = new FetchHttpClient();
  const supplierDb = new SupplierService({dbClient}, commons);
  /*const laLookupService = new LaLookupService({baseUrl: process.env.LA_LOOKUP_URL!, httpClient}, commons);*/

  return {
    commons,
    supplierDb,
    /*laLookupService*/
  }
}
