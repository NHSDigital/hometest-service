export interface AwsClientOptions {
  region: string;
  endpoint?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
}

/**
 * Builds shared AWS SDK client options for lambda-side AWS clients.
 *
 * Behavior by environment:
 * - Production AWS Lambda: returns region-only options so the SDK uses its
 *   default credential provider chain (for example, execution role and
 *   refreshable temporary credentials).
 * - Local development with LocalStack: when AWS_ENDPOINT_URL is set, includes
 *   the custom endpoint and optionally explicit credentials from env vars.
 *
 * Use this helper when constructing AWS SDK clients that should follow the
 * same endpoint and credential-resolution rules across the codebase.
 */
export function getAwsClientOptions(region: string): AwsClientOptions {
  const endpoint = process.env.AWS_ENDPOINT_URL;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;

  const options: AwsClientOptions = endpoint ? { region, endpoint } : { region };

  if (endpoint && accessKeyId && secretAccessKey) {
    options.credentials = {
      accessKeyId,
      secretAccessKey,
      ...(sessionToken ? { sessionToken } : {}),
    };
  }

  return options;
}
