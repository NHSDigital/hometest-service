import { HttpClient } from "../http/http-client";
import { SecretsClient } from "../secrets/secrets-manager-client";
import type { SupplierConfig } from "../db/supplier-db";

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface SupplierAuthClient {
  getAccessToken(): Promise<string>;
}

export class OAuthSupplierAuthClient implements SupplierAuthClient {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly secretsClient: SecretsClient,
    private readonly baseUrl: string,
    private readonly tokenPath: string,
    private readonly clientId: string,
    private readonly secretName: string,
    private readonly scope: string,
  ) {}

  static fromSupplierConfig(
    httpClient: HttpClient,
    secretsClient: SecretsClient,
    supplierConfig: SupplierConfig,
  ): OAuthSupplierAuthClient {
    return new OAuthSupplierAuthClient(
      httpClient,
      secretsClient,
      supplierConfig.serviceUrl,
      supplierConfig.oauthTokenPath,
      supplierConfig.clientId,
      supplierConfig.clientSecretName,
      supplierConfig.oauthScope,
    );
  }

  async getAccessToken(): Promise<string> {
    const clientSecret = await this.secretsClient.getSecretValue(this.secretName);

    const tokenUrl = `${this.baseUrl.replace(/\/$/, "")}${this.tokenPath}`;
    const formBody = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: clientSecret,
      scope: this.scope,
    });

    const tokenData = await this.httpClient.post<OAuthTokenResponse>(
      tokenUrl,
      formBody.toString(),
      { Accept: "application/json" },
      "application/x-www-form-urlencoded",
    );

    return tokenData.access_token;
  }
}
