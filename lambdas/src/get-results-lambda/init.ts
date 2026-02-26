import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { FetchHttpClient } from "../lib/http/http-client";
import { PostgresDbClient } from "../lib/db/db-client";
import { SupplierService } from "../lib/db/supplier-db";
import { SupplierTestResultsService } from "../lib/supplier/supplier-test-results-service";
import { TestResultDbClient } from "../lib/db/test-result-db-client";

export interface Environment {
  testResultDbClient: TestResultDbClient;
  supplierTestResultsService: SupplierTestResultsService;
}

export function init(): Environment {
  const databaseUrl = process.env.DATABASE_URL!;
  const awsRegion =
    process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";

  const httpClient = new FetchHttpClient();

  const dbClient = new PostgresDbClient(databaseUrl);
  const testResultDbClient = new TestResultDbClient(dbClient);

  const supplierDb = new SupplierService({ dbClient });
  const secretsClient = new AwsSecretsClient(awsRegion);
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
