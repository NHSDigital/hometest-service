import { ClientConfig } from "pg";
import {
  retrieveMandatoryEnvVariable,
  retrieveOptionalEnvVariable,
} from "../utils";
import { EU_WEST_2_BUNDLE } from "../../certs/eu-west-2-bundle";

import type { SecretsClient } from "../secrets/secrets-manager-client";

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

export function postgresConfig(options: PostgresConfigOptions): ClientConfig {
  const configOptions = options.schema
    ? `-c search_path=${options.schema}`
    : undefined;

  return {
    user: options.username,
    host: options.address,
    port: Number.parseInt(options.port, 10),
    database: options.database,
    password: async () => {
      const password = await options.secretsClient.getSecretValue(
        options.passwordSecretName,
        { jsonKey: "password" },
      );
      // Trim whitespace and remove surrounding quotes
      return password.trim().replaceAll(/(^["']|["']$)/g, "");
    },
    options: configOptions,
    ssl: buildSslConfig(options.sslEnabled),
  };
}

export function postgresConfigFromEnv(
  secretsClient: SecretsClient,
): ClientConfig {
  const sslEnabled = retrieveOptionalEnvVariable("DB_SSL", "true") === "true";

  const config: PostgresConfigOptions = {
    username: retrieveMandatoryEnvVariable("DB_USERNAME"),
    address: retrieveMandatoryEnvVariable("DB_ADDRESS"),
    port: retrieveMandatoryEnvVariable("DB_PORT"),
    database: retrieveMandatoryEnvVariable("DB_NAME"),
    schema: retrieveOptionalEnvVariable("DB_SCHEMA"),
    passwordSecretName: retrieveMandatoryEnvVariable("DB_SECRET_NAME"),
    secretsClient,
    sslEnabled,
  };

  return postgresConfig(config);
}
