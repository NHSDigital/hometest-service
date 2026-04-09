import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { SupplierService } from "../lib/db/supplier-db";
import { TestResultDbClient } from "../lib/db/test-result-db-client";
import { FetchHttpClient } from "../lib/http/http-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { SupplierTestResultsService } from "../lib/supplier/supplier-test-results-service";
import { retrieveMandatoryEnvVariable } from "../lib/utils/utils";

export interface Environment {
  testResultDbClient: TestResultDbClient;
  supplierTestResultsService: SupplierTestResultsService;
}

export function buildEnvironment(): Environment {
  const awsRegion = retrieveMandatoryEnvVariable("AWS_REGION");

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

let _env: Environment | undefined;

export function init(): Environment {
  _env ??= buildEnvironment();
  return _env;
}
