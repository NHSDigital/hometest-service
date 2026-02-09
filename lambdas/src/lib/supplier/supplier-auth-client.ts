import { HttpClient } from "../http/http-client";
import { SecretsClient } from "../secrets/secrets-manager-client";

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
    private readonly tokenPath: string = "/oauth/token",
    private readonly clientId: string,
    private readonly secretName: string,
    private readonly scope: string = "orders results",
  ) {}

  async getAccessToken(): Promise<string> {
    const clientSecret = await this.secretsClient.getSecretValue(
      this.secretName,
      { jsonKey: "client_secret" },
    );

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
