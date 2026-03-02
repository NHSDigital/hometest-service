import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { FetchHttpClient } from "../lib/http/http-client";
import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { SupplierService } from "../lib/db/supplier-db";
import { SupplierTestResultsService } from "../lib/supplier/supplier-test-results-service";
import { TestResultDbClient } from "../lib/db/test-result-db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";

export interface Environment {
  testResultDbClient: TestResultDbClient;
  supplierTestResultsService: SupplierTestResultsService;
}

export function init(): Environment {
  const awsRegion =
    process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";

  const httpClient = new FetchHttpClient();
  const secretsClient = new AwsSecretsClient(awsRegion);

  const dbClient = new PostgresDbClient(postgresConfigFromEnv(secretsClient));
  const testResultDbClient = new TestResultDbClient(dbClient);

  const supplierDb = new SupplierService({ dbClient });
  const supplierTestResultsService = new SupplierTestResultsService(
    httpClient,
    secretsClient,
    supplierDb,
  );

  return {
    testResultDbClient,
    supplierTestResultsService,
  };
}
