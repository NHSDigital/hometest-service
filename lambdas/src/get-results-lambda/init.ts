import { AwsSecretsClient } from "src/lib/secrets/secrets-manager-client";
import { FetchHttpClient } from "src/lib/http/http-client";
import { PostgresDbClient } from "../lib/db/db-client";
import { SupplierService } from "src/lib/db/supplier-db";
import { TestResultDbClient } from "../lib/db/test-result-db-client";

export interface Environment {
  httpClient: FetchHttpClient;
  testResultDbClient: TestResultDbClient;
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
  const testResultDbClient = new TestResultDbClient(dbClient);
  const secretsClient = new AwsSecretsClient(awsRegion);

  return {
    httpClient,
    testResultDbClient,
    supplierDb,
    secretsClient,
  };
}
