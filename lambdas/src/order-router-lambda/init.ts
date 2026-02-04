import { FetchHttpClient } from "../lib/http/http-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";

export interface Environment {
  httpClient: FetchHttpClient;
  secretsClient: AwsSecretsClient;
}

export function init(): Environment {
  const httpClient = new FetchHttpClient();
  const secretsClient = new AwsSecretsClient();

  return {
    httpClient,
    secretsClient,
  };
}
