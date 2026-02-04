import {
  GetSecretValueCommand,
  SecretsManagerClient as AwsSecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

export interface SecretsClient {
  getSecretString(secretName: string): Promise<string>;
  getSecretValue(
    secretName: string,
    options?: { jsonKey?: string },
  ): Promise<string>;
}

export class AwsSecretsClient implements SecretsClient {
  private client: AwsSecretsManagerClient;

  constructor(region?: string) {
    const awsRegion =
      region ||
      process.env.AWS_REGION ||
      process.env.AWS_DEFAULT_REGION ||
      "eu-west-1";
    this.client = new AwsSecretsManagerClient({ region: awsRegion });
  }

  async getSecretString(secretName: string): Promise<string> {
    const response = await this.client.send(
      new GetSecretValueCommand({ SecretId: secretName }),
    );

    if (!response.SecretString) {
      throw new Error("Secret string is empty");
    }

    return response.SecretString;
  }

  async getSecretValue(
    secretName: string,
    options?: { jsonKey?: string },
  ): Promise<string> {
    const secretString = await this.getSecretString(secretName);

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
  }
}
