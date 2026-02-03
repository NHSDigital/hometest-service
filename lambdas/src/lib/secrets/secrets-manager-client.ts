import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

const getRegion = (): string => {
  return (
    process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-1"
  );
};

const secretsClient = new SecretsManagerClient({ region: getRegion() });

const getSecretString = async (secretName: string): Promise<string> => {
  const response = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: secretName }),
  );

  if (!response.SecretString) {
    throw new Error("Secret string is empty");
  }

  return response.SecretString;
};

const getSecretValue = async (
  secretName: string,
  options?: { jsonKey?: string },
): Promise<string> => {
  const secretString = await getSecretString(secretName);

  if (!options?.jsonKey) {
    return secretString;
  }

  try {
    const parsed = JSON.parse(secretString) as Record<string, unknown>;
    const value = parsed[options.jsonKey];

    if (typeof value !== "string" || value.length === 0) {
      throw new Error(`${options.jsonKey} missing in secret JSON`);
    }

    return value;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return secretString;
    }
    throw error;
  }
};

export { getSecretString, getSecretValue };
