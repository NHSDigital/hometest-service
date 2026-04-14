import { PostcodeLookupClientConfig } from "../lib/models/postcode-lookup-client-config";
import { OSPlacesClient } from "../lib/postcode-lookup/osplaces/osplaces-client";
import { PostcodeLookupClient } from "../lib/postcode-lookup/postcode-lookup-client-interface";
import { PostcodeLookupService } from "../lib/postcode-lookup/postcode-lookup-service";
import { StubPostcodeLookupClient } from "../lib/postcode-lookup/stub/stub-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import {
  retrieveMandatoryEnvVariable,
  retrieveOptionalEnvVariableWithDefault,
} from "../lib/utils/utils";
import { PostcodeLookupDependencies } from "./postcode-lookup-dependencies";
import { PostcodeLookupEnvVariables } from "./postcode-lookup-env-variables";

const envVars: PostcodeLookupEnvVariables = {
  postcodeLookupCredentialsSecretName: retrieveMandatoryEnvVariable(
    "POSTCODE_LOOKUP_CREDENTIALS_SECRET_NAME",
  ),
  postcodeLookupBaseUrl: retrieveMandatoryEnvVariable("POSTCODE_LOOKUP_BASE_URL"),
  postcodeLookupTimeoutMs: Number(
    retrieveOptionalEnvVariableWithDefault("POSTCODE_LOOKUP_TIMEOUT_MS", "5000"),
  ),
  postcodeLookupMaxRetries: Number(
    retrieveOptionalEnvVariableWithDefault("POSTCODE_LOOKUP_MAX_RETRIES", "3"),
  ),
  postcodeLookupRetryDelayMs: Number(
    retrieveOptionalEnvVariableWithDefault("POSTCODE_LOOKUP_RETRY_DELAY_MS", "1000"),
  ),
  postcodeLookupRetryBackoffFactor: Number(
    retrieveOptionalEnvVariableWithDefault("POSTCODE_LOOKUP_RETRY_BACKOFF_FACTOR", "2"),
  ),
  useStubClient:
    retrieveOptionalEnvVariableWithDefault("USE_STUB_POSTCODE_CLIENT", "false") === "true",
};

export async function buildEnvironment(): Promise<PostcodeLookupDependencies> {
  const secretManagerClient = new AwsSecretsClient(retrieveMandatoryEnvVariable("AWS_REGION"));
  const credentialsSecret = await secretManagerClient.getSecretValue(
    envVars.postcodeLookupCredentialsSecretName,
  );
  const credentials = JSON.parse(credentialsSecret) as { apiKey: string };

  const postcodeLookupClientConfig: PostcodeLookupClientConfig = {
    credentials: credentials,
    baseUrl: envVars.postcodeLookupBaseUrl,
    timeoutMs: envVars.postcodeLookupTimeoutMs,
    maxRetries: envVars.postcodeLookupMaxRetries,
    retryDelayMs: envVars.postcodeLookupRetryDelayMs,
    retryBackoffFactor: envVars.postcodeLookupRetryBackoffFactor,
  };

  let postcodeLookupClient: PostcodeLookupClient;

  if (envVars.useStubClient) {
    postcodeLookupClient = new StubPostcodeLookupClient(postcodeLookupClientConfig);
  } else {
    postcodeLookupClient = new OSPlacesClient(postcodeLookupClientConfig);
  }

  const postcodeLookupService = new PostcodeLookupService(postcodeLookupClient);

  return {
    postcodeLookupService,
  };
}

let _env: Promise<PostcodeLookupDependencies> | undefined;

export function init(): Promise<PostcodeLookupDependencies> {
  _env ??= buildEnvironment().catch((error) => {
    // Clear cached environment on failure so subsequent calls can retry
    _env = undefined;
    throw error;
  });
  return _env;
}
