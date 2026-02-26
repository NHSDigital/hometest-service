import { FetchHttpClient } from "../lib/http/http-client";
import { SupplierService } from "../lib/db/supplier-db";
import { PostgresDbClient } from "../lib/db/db-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { postgresFromEnv } from "../lib/db/connection-string-provider";
import { retrieveOptionalEnvVariable } from "../lib/utils";

export interface Environment {
  httpClient: FetchHttpClient;
  supplierDb: SupplierService;
  secretsClient: AwsSecretsClient;
}

export function init(): Environment {
  const awsRegion =
    process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";

  const httpClient = new FetchHttpClient();
  const secretsClient = new AwsSecretsClient(awsRegion);
  const sslEnabled = retrieveOptionalEnvVariable("DB_SSL", "true") === "true";
  const dbClient = new PostgresDbClient(postgresFromEnv(secretsClient), {
    enabled: sslEnabled,
    rejectUnauthorized: sslEnabled,
  });
  const supplierDb = new SupplierService({ dbClient });

  return {
    httpClient,
    supplierDb,
    secretsClient,
  };
}
