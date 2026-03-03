import { Commons, ConsoleCommons } from "../lib/commons";
import { SupplierService } from "../lib/db/supplier-db";
import { LaLookupService } from "./la-lookup";
import { PostgresDbClient } from "../lib/db/db-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
<<<<<<< HEAD
import { postgresFromEnv } from "../lib/db/connection-string-provider";
=======
import { postgresConfigFromEnv } from "../lib/db/db-config";
>>>>>>> 8c47243a733da9c990ea007b2ad300ca1b1f0e72

export interface Environment {
  commons: Commons;
  supplierDb: SupplierService;
  laLookupService: LaLookupService;
}

export function init(): Environment {
  const commons = new ConsoleCommons();
  const awsRegion =
    process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";
  const secretsClient = new AwsSecretsClient(awsRegion);
<<<<<<< HEAD
  const dbClient = new PostgresDbClient(postgresFromEnv(secretsClient));
=======
  const dbClient = new PostgresDbClient(postgresConfigFromEnv(secretsClient));
>>>>>>> 8c47243a733da9c990ea007b2ad300ca1b1f0e72
  const supplierDb = new SupplierService({ dbClient });
  const laLookupService = new LaLookupService();

  return {
    commons,
    supplierDb,
    laLookupService,
  };
}
