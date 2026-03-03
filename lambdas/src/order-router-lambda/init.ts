import { FetchHttpClient } from "../lib/http/http-client";
import { SupplierService } from "../lib/db/supplier-db";
import { PostgresDbClient } from "../lib/db/db-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
<<<<<<< HEAD
import { postgresFromEnv } from "../lib/db/connection-string-provider";
=======
import { postgresConfigFromEnv } from "../lib/db/db-config";
>>>>>>> 8c47243a733da9c990ea007b2ad300ca1b1f0e72

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
<<<<<<< HEAD
  const dbClient = new PostgresDbClient(postgresFromEnv(secretsClient));
=======
  const dbClient = new PostgresDbClient(postgresConfigFromEnv(secretsClient));
>>>>>>> 8c47243a733da9c990ea007b2ad300ca1b1f0e72
  const supplierDb = new SupplierService({ dbClient });

  return {
    httpClient,
    supplierDb,
    secretsClient,
  };
}
