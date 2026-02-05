import { FetchHttpClient } from "../lib/http/http-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { OAuthSupplierAuthClient } from "../lib/supplier/supplier-auth-client";

export interface EnvironmentVariables {
  SUPPLIER_BASE_URL: string;
  SUPPLIER_OAUTH_TOKEN_PATH?: string;
  SUPPLIER_CLIENT_ID: string;
  SUPPLIER_CLIENT_SECRET_NAME: string;
  SUPPLIER_ORDER_PATH: string;
}

export interface Environment {
  httpClient: FetchHttpClient;
  supplierAuthClient: OAuthSupplierAuthClient;
  environmentVariables: EnvironmentVariables;
}

export function init(): Environment {
  const baseUrl = process.env.SUPPLIER_BASE_URL || "";
  const tokenPath = process.env.SUPPLIER_OAUTH_TOKEN_PATH || "/oauth/token";
  const clientId = process.env.SUPPLIER_CLIENT_ID || "";
  const secretName = process.env.SUPPLIER_CLIENT_SECRET_NAME || "";
  const orderPath = process.env.SUPPLIER_ORDER_PATH || "/order";
  const awsRegion =
    process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-1";

  const httpClient = new FetchHttpClient();
  const secretsClient = new AwsSecretsClient(awsRegion);
  const supplierAuthClient = new OAuthSupplierAuthClient(
    httpClient,
    secretsClient,
    baseUrl,
    tokenPath,
    clientId,
    secretName,
  );

  return {
    httpClient,
    supplierAuthClient,
    environmentVariables: {
      SUPPLIER_BASE_URL: baseUrl,
      SUPPLIER_OAUTH_TOKEN_PATH: tokenPath,
      SUPPLIER_CLIENT_ID: clientId,
      SUPPLIER_CLIENT_SECRET_NAME: secretName,
      SUPPLIER_ORDER_PATH: orderPath,
    },
  };
}
