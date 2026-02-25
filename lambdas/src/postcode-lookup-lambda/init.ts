import { retrieveMandatoryEnvVariable, retrieveOptionalEnvVariable } from '../lib/utils';
import { PostcodeLookupService } from '../lib/postcode-lookup/postcode-lookup-service';
import { OSPlacesClient } from '../lib/postcode-lookup/osplaces/osplaces-client';
import { StubPostcodeLookupClient } from '../lib/postcode-lookup/stub/stub-client';
import { PostcodeLookupClient } from '../lib/postcode-lookup/postcode-lookup-client-interface';
import { PostcodeLookupEnvVariables } from './postcode-lookuo-env-variables';
import { PostcodeLookupDependencies } from './postcode-lookup-dependencies';
import { AwsSecretsClient } from '../lib/secrets/secrets-manager-client';
import { PostcodeLookupClientConfig } from '../lib/models/postcode-lookup-client-config';

const envVars: PostcodeLookupEnvVariables = {
  postcodeLookupCredentialsSecretName: retrieveMandatoryEnvVariable('POSTCODE_LOOKUP_CREDENTIALS_SECRET_NAME'),
  postcodeLookupBaseUrl: retrieveMandatoryEnvVariable('POSTCODE_LOOKUP_BASE_URL'),
  postcodeLookupTimeoutMs: Number(retrieveOptionalEnvVariable('POSTCODE_LOOKUP_TIMEOUT_MS') ?? '5000'),
  postcodeLookupMaxRetries: Number(retrieveOptionalEnvVariable('POSTCODE_LOOKUP_MAX_RETRIES') ?? '3'),
  postcodeLookupRetryDelayMs: Number(retrieveOptionalEnvVariable('POSTCODE_LOOKUP_RETRY_DELAY_MS') ?? '1000'),
  postcodeLookupRetryBackoffFactor: Number(retrieveOptionalEnvVariable('POSTCODE_LOOKUP_RETRY_BACKOFF_FACTOR') ?? '2'),
  useStubClient: retrieveOptionalEnvVariable('USE_STUB_POSTCODE_CLIENT') === 'true',
  rejectUnauthorized: retrieveOptionalEnvVariable('POSTCODE_LOOKUP_REJECT_UNAUTHORIZED') === 'true',
};

export async function init(): Promise<PostcodeLookupDependencies> {
  const secretManagerClient = new AwsSecretsClient(process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2");
  const credentialsSecret = await secretManagerClient.getSecretValue(envVars.postcodeLookupCredentialsSecretName);
  const credentials = JSON.parse(credentialsSecret) as { apiKey: string; };

  const postcodeLookupClientConfig: PostcodeLookupClientConfig = {
    credentials: credentials,
    baseUrl: envVars.postcodeLookupBaseUrl,
    timeoutMs: envVars.postcodeLookupTimeoutMs,
    maxRetries: envVars.postcodeLookupMaxRetries,
    retryDelayMs: envVars.postcodeLookupRetryDelayMs,
    retryBackoffFactor: envVars.postcodeLookupRetryBackoffFactor,
    rejectUnauthorized: envVars.rejectUnauthorized,
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
