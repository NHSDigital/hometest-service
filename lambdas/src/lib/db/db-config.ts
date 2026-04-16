import { ClientConfig } from "pg";

import { EU_WEST_2_BUNDLE } from "../../certs/eu-west-2-bundle";
import type { SecretsClient } from "../secrets/secrets-manager-client";
import {
  retrieveMandatoryEnvVariable,
  retrieveOptionalEnvVariable,
  retrieveOptionalEnvVariableWithDefault,
} from "../utils/utils";
import type { RdsIamAuthClient } from "./rds-iam-auth";
import { AwsRdsIamAuthClient } from "./rds-iam-auth";

export interface PostgresConfigOptions {
  username: string;
  address: string;
  port: string;
  database: string;
  schema?: string;
  passwordSecretName: string;
  secretsClient: SecretsClient;
  sslEnabled: boolean;
}

export interface PostgresIamConfigOptions {
  username: string;
  address: string;
  port: string;
  database: string;
  schema?: string;
  region: string;
  sslEnabled: boolean;
  /** Optional: inject a custom IAM auth client (useful for testing) */
  iamAuthClient?: RdsIamAuthClient;
}

function buildSslConfig(sslEnabled: boolean): false | { rejectUnauthorized: boolean; ca: string } {
  if (!sslEnabled) {
    return false;
  }

  // Use strict SSL with AWS RDS certificate
  return {
    rejectUnauthorized: true,
    ca: EU_WEST_2_BUNDLE,
  };
}

function buildSearchPathOptions(schema?: string): string | undefined {
  return schema ? `-c search_path=${schema}` : undefined;
}

export function postgresConfig(options: PostgresConfigOptions): ClientConfig {
  return {
    user: options.username,
    host: options.address,
    port: Number.parseInt(options.port, 10),
    database: options.database,
    password: async () => {
      const password = await options.secretsClient.getSecretValue(options.passwordSecretName, {
        jsonKey: "password",
      });
      // Trim whitespace and remove surrounding quotes
      return password.trim().replaceAll(/(^["']|["']$)/g, "");
    },
    options: buildSearchPathOptions(options.schema),
    ssl: buildSslConfig(options.sslEnabled),
  };
}

/**
 * Build a Postgres client config using RDS IAM authentication.
 * The password is a short-lived IAM auth token (valid for 15 minutes)
 * generated on each new connection.
 *
 * Requirements:
 * - The Lambda's execution role must have the rds-db:connect IAM permission
 * - SSL must be enabled (RDS IAM auth requires encrypted connections)
 */
export function postgresIamConfig(options: PostgresIamConfigOptions): ClientConfig {
  const portNumber = Number.parseInt(options.port, 10);

  const iamAuthClient =
    options.iamAuthClient ??
    new AwsRdsIamAuthClient({
      hostname: options.address,
      port: portNumber,
      username: options.username,
      region: options.region,
    });

  return {
    user: options.username,
    host: options.address,
    port: portNumber,
    database: options.database,
    password: async () => iamAuthClient.getAuthToken(),
    options: buildSearchPathOptions(options.schema),
    // IAM auth requires SSL; enforce it regardless of the sslEnabled flag
    ssl: buildSslConfig(true),
  };
}

/**
 * Build Postgres client config from environment variables.
 *
 * Supports two authentication modes controlled by the USE_IAM_AUTH env var:
 * - USE_IAM_AUTH=true  → RDS IAM authentication (no Secrets Manager needed for DB password)
 * - USE_IAM_AUTH=false → Secrets Manager password (default, backwards-compatible)
 *
 * When using IAM auth, the DB_SECRET_NAME env var is not required.
 * The DB_REGION env var, or otherwise the mandatory AWS_REGION env var, determines the AWS region.
 */
export function postgresConfigFromEnv(secretsClient: SecretsClient): ClientConfig {
  const sslEnabled = retrieveOptionalEnvVariableWithDefault("DB_SSL", "true") === "true";
  const useIamAuth = retrieveOptionalEnvVariableWithDefault("USE_IAM_AUTH", "false") === "true";

  const username = retrieveMandatoryEnvVariable("DB_USERNAME");
  const address = retrieveMandatoryEnvVariable("DB_ADDRESS");
  const port = retrieveMandatoryEnvVariable("DB_PORT");
  const database = retrieveMandatoryEnvVariable("DB_NAME");
  const schema = retrieveOptionalEnvVariable("DB_SCHEMA");

  if (useIamAuth) {
    const region =
      retrieveOptionalEnvVariable("DB_REGION") ?? retrieveMandatoryEnvVariable("AWS_REGION");

    return postgresIamConfig({
      username,
      address,
      port,
      database,
      schema,
      region,
      sslEnabled,
    });
  }

  return postgresConfig({
    username,
    address,
    port,
    database,
    schema,
    passwordSecretName: retrieveMandatoryEnvVariable("DB_SECRET_NAME"),
    secretsClient,
    sslEnabled,
  });
}
