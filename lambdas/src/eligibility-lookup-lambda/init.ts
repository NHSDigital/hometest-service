import { Commons, ConsoleCommons } from "../lib/commons";
import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { SupplierService } from "../lib/db/supplier-db";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { retrieveMandatoryEnvVariable } from "../lib/utils/utils";
import { LaLookupService } from "./la-lookup";

export interface Environment {
  commons: Commons;
  supplierDb: SupplierService;
  laLookupService: LaLookupService;
}

export function buildEnvironment(): Environment {
  const commons = new ConsoleCommons();
  const awsRegion = retrieveMandatoryEnvVariable("AWS_REGION");
  const secretsClient = new AwsSecretsClient(awsRegion);
  const dbClient = new PostgresDbClient(postgresConfigFromEnv(secretsClient));
  const supplierDb = new SupplierService({ dbClient });
  const laLookupService = new LaLookupService();

  return {
    commons,
    supplierDb,
    laLookupService,
  };
}

let _env: Environment | undefined;

export function init(): Environment {
  _env ??= buildEnvironment();
  return _env;
}
