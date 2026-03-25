import { HttpClient } from "../http/http-client";
import { SecretsClient } from "../secrets/secrets-manager-client";
import type { SupplierConfig } from "../db/supplier-db";

interface CachedSupplierToken {
  accessToken: string;
  expiresAtMs: number;
}

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface SupplierAuthClient {
  getAccessToken(): Promise<string>;
}

export interface SupplierToken {
  accessToken: string;
  expiresInSeconds: number;
}

export interface SupplierTokenGenerator {
  generateToken(): Promise<string>;
}

const TOKEN_REFRESH_BUFFER_MS = 30_000;
const MAX_TOKEN_TTL_SECONDS = 86_399;

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

  async getToken(): Promise<SupplierToken> {
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

    return {
      accessToken: tokenData.access_token,
      expiresInSeconds: tokenData.expires_in,
    };
  }

  async getAccessToken(): Promise<string> {
    const token = await this.getToken();
    return token.accessToken;
  }
}

class CachedSupplierTokenGenerator implements SupplierTokenGenerator {
  private cachedToken: CachedSupplierToken | null = null;
  private inFlightTokenRequest: Promise<string> | null = null;

  constructor(
    private readonly authClient: OAuthSupplierAuthClient,
    private readonly now: () => number = Date.now,
  ) {}

  async generateToken(): Promise<string> {
    if (this.hasValidCachedToken()) {
      return this.cachedToken!.accessToken;
    }

    if (this.inFlightTokenRequest) {
      return this.inFlightTokenRequest;
    }

    this.inFlightTokenRequest = this.fetchAndCacheToken();

    try {
      return await this.inFlightTokenRequest;
    } finally {
      this.inFlightTokenRequest = null;
    }
  }

  private hasValidCachedToken(): boolean {
    return !!(this.cachedToken && this.isTokenValid(this.cachedToken.expiresAtMs));
  }

  private isTokenValid(expiresAtMs: number): boolean {
    return this.now() < expiresAtMs - TOKEN_REFRESH_BUFFER_MS;
  }

  private async fetchAndCacheToken(): Promise<string> {
    const token = await this.authClient.getToken();
    const ttlSeconds = Math.min(Math.max(token.expiresInSeconds, 0), MAX_TOKEN_TTL_SECONDS);
    this.cachedToken = {
      accessToken: token.accessToken,
      expiresAtMs: this.now() + ttlSeconds * 1000,
    };

    return token.accessToken;
  }
}

const tokenGeneratorCache: Record<string, SupplierTokenGenerator> = {};

const buildTokenGeneratorCacheKey = (supplierConfig: SupplierConfig): string => {
  return [
    supplierConfig.serviceUrl,
    supplierConfig.oauthTokenPath,
    supplierConfig.clientId,
    supplierConfig.clientSecretName,
    supplierConfig.oauthScope,
  ].join("|");
};

export const getTokenGenerator = (
  httpClient: HttpClient,
  secretsClient: SecretsClient,
  supplierConfig: SupplierConfig,
): SupplierTokenGenerator => {
  const cacheKey = buildTokenGeneratorCacheKey(supplierConfig);
  const existingGenerator = tokenGeneratorCache[cacheKey];

  if (existingGenerator) {
    return existingGenerator;
  }

  const authClient = OAuthSupplierAuthClient.fromSupplierConfig(
    httpClient,
    secretsClient,
    supplierConfig,
  );

  const tokenGenerator = new CachedSupplierTokenGenerator(authClient);
  tokenGeneratorCache[cacheKey] = tokenGenerator;

  return tokenGenerator;
};

export const __resetSupplierTokenGeneratorCacheForTests = (): void => {
  for (const cacheKey of Object.keys(tokenGeneratorCache)) {
    delete tokenGeneratorCache[cacheKey];
  }
};
