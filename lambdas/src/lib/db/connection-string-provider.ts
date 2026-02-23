import {retrieveMandatoryEnvVariable, retrieveOptionalEnvVariable} from "../utils";

export interface ConnectionStringProvider {
  getConnectionString(): Promise<string>;
  getSslEnabled(): boolean;
}

import type { SecretsClient } from "../secrets/secrets-manager-client";

export interface ConnectionConfig {
  username: string;
  address: string;
  port: string;
  database: string;
  schema?: string;
  passwordSecretName: string;
  ssl?: boolean;
}

export function postgresConnection(config: ConnectionConfig, secretsClient: SecretsClient): ConnectionStringProvider {
  let connectionStringPromise: Promise<string> | null = null;

  return {
    async getConnectionString(): Promise<string> {
      if (!connectionStringPromise) {
        connectionStringPromise = buildConnectionString(config, secretsClient);
      }
      return connectionStringPromise;
    },
    getSslEnabled(): boolean {
      return config.ssl !== false;
    }
  };
}

export function postgresFromEnv(secretsClient: SecretsClient): ConnectionStringProvider {
  const config: ConnectionConfig = {
    username: retrieveMandatoryEnvVariable("DB_USERNAME"),
    address: retrieveMandatoryEnvVariable("DB_ADDRESS"),
    port: retrieveMandatoryEnvVariable("DB_PORT"),
    database: retrieveMandatoryEnvVariable("DB_NAME"),
    schema: retrieveOptionalEnvVariable("DB_SCHEMA"),
    passwordSecretName: retrieveMandatoryEnvVariable("DB_SECRET_NAME"),
    ssl: retrieveOptionalEnvVariable("DB_SSL", "true") === "true"
  };

  return postgresConnection(config, secretsClient);
}

async function buildConnectionString(
  config: ConnectionConfig,
  secretsClient: SecretsClient
): Promise<string> {
  const password = await secretsClient.getSecretValue(
    config.passwordSecretName,
    { jsonKey: "password" },
  );

  const username = encodeURIComponent(config.username);
  const sanitisedPassword = password.trim().replace(/^["']|["']$/g, '');
  const encodedPassword = encodeURIComponent(sanitisedPassword);
  const address = config.address;
  const port = config.port;
  const database = config.database;
  const base = `postgresql://${username}:${encodedPassword}@${address}:${port}/${database}`;

  const queryParams: string[] = [];

  if (config.schema) {
    const schemaOption = encodeURIComponent(`-c search_path=${config.schema}`);
    queryParams.push(`options=${schemaOption}`);
  }

  return queryParams.length > 0 ? `${base}?${queryParams.join('&')}` : base;
}
