import { Commons, ConsoleCommons } from "../lib/commons";
import { SupplierService } from "../lib/db/supplier-db";
import { LaLookupService } from "./la-lookup";
import { PostgresDbClient } from "../lib/db/db-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { retrieveMandatoryEnvVariable } from "../lib/utils";


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
  const dbClient = new PostgresDbClient(
    {
      username: retrieveMandatoryEnvVariable("DB_USERNAME"),
      address: retrieveMandatoryEnvVariable("DB_ADDRESS"),
      port: retrieveMandatoryEnvVariable("DB_PORT"),
      database: retrieveMandatoryEnvVariable("DB_NAME"),
      schema: retrieveMandatoryEnvVariable("DB_SCHEMA"),
      passwordSecretName: retrieveMandatoryEnvVariable("DB_SECRET_NAME"),
    },
    secretsClient,
  );
  const supplierDb = new SupplierService({ dbClient });
  const laLookupService = new LaLookupService();

  return {
    commons,
    supplierDb,
    laLookupService,
  };
}
