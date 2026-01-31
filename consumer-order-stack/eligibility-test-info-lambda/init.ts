import {Commons, ConsoleCommons} from "../../lambdas/shared/src/commons";
import {SupplierService} from "../../lambdas/shared/src/db/supplier-db";
import {LaLookupService} from "./la-lookup";
import {PostgresDbClient} from "../../lambdas/shared/src/db/db-client";
import {FetchHttpClient} from "../../lambdas/shared/src/http/http-client";

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
