import { FetchHttpClient } from "../lib/http/http-client";
import { SupplierService } from "../lib/db/supplier-db";
import { PostgresDbClient } from "../lib/db/db-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";

export interface Environment {
  httpClient: FetchHttpClient;
  supplierDb: SupplierService;
  secretsClient: AwsSecretsClient;
}

export function init(): Environment {
  const databaseUrl = process.env.DATABASE_URL!;
  const awsRegion =
    process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";

  const httpClient = new FetchHttpClient();
  const dbClient = new PostgresDbClient(databaseUrl);
  const supplierDb = new SupplierService({ dbClient });
  const secretsClient = new AwsSecretsClient(awsRegion);

  return {
    httpClient,
    supplierDb,
    secretsClient,
  };
}
