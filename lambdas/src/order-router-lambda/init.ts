import { FetchHttpClient } from "../lib/http/http-client";
import { SupplierService } from "../lib/db/supplier-db";
import { PostgresDbClient } from "../lib/db/db-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";

export interface EnvironmentVariables {
  SUPPLIER_OAUTH_TOKEN_PATH: string;
  SUPPLIER_CLIENT_ID: string;
  SUPPLIER_CLIENT_SECRET_NAME: string;
  SUPPLIER_ORDER_PATH: string;
  DATABASE_URL: string;
}

export interface Environment {
  httpClient: FetchHttpClient;
  environmentVariables: EnvironmentVariables;
  supplierDb: SupplierService;
  secretsClient: AwsSecretsClient;
}

export function init(): Environment {
  const tokenPath = process.env.SUPPLIER_OAUTH_TOKEN_PATH || "/oauth/token";
  const clientId = process.env.SUPPLIER_CLIENT_ID || "";
  const secretName = process.env.SUPPLIER_CLIENT_SECRET_NAME || "";
  const orderPath = process.env.SUPPLIER_ORDER_PATH || "/order";
  const databaseUrl = process.env.DATABASE_URL || "";
  const awsRegion =
    process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-1";

  const httpClient = new FetchHttpClient();
  const dbClient = new PostgresDbClient(databaseUrl);
  const supplierDb = new SupplierService({ dbClient });
  const secretsClient = new AwsSecretsClient(awsRegion);

  return {
    httpClient,
    environmentVariables: {
      SUPPLIER_OAUTH_TOKEN_PATH: tokenPath,
      SUPPLIER_CLIENT_ID: clientId,
      SUPPLIER_CLIENT_SECRET_NAME: secretName,
      SUPPLIER_ORDER_PATH: orderPath,
      DATABASE_URL: databaseUrl,
    },
    supplierDb,
    secretsClient,
  };
}
