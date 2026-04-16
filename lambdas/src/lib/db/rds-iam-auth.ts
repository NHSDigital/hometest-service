import { Signer } from "@aws-sdk/rds-signer";

/**
 * Interface for generating RDS IAM authentication tokens.
 * Tokens are short-lived (15 minutes) and used as the DB password.
 */
export interface RdsIamAuthClient {
  getAuthToken(): Promise<string>;
}

/**
 * Generates RDS IAM auth tokens using the Lambda's execution role credentials.
 * The Lambda's execution role must have the rds-db:connect IAM permission.
 */
export class AwsRdsIamAuthClient implements RdsIamAuthClient {
  private readonly signer: Signer;

  constructor(options: { hostname: string; port: number; username: string; region: string }) {
    this.signer = new Signer(options);
  }

  async getAuthToken(): Promise<string> {
    return this.signer.getAuthToken();
  }
}
