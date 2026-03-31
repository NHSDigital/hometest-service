import { Commons, ConsoleCommons } from "../lib/commons";
import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { SupplierService } from "../lib/db/supplier-db";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { LaLookupService } from "./la-lookup";

export interface Environment {
  commons: Commons;
  supplierDb: SupplierService;
  laLookupService: LaLookupService;
}

export function buildEnvironment(): Environment {
  const commons = new ConsoleCommons();
  const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";
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
