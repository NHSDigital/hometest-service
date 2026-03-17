import {OAuthSupplierAuthClient2, SupplierAuthClient2} from "./supplier-auth-client";
import {SupplierConfig} from "../db/supplier-db";
import {HttpClient} from "../http/http-client";
import {SecretsClient} from "../secrets/secrets-manager-client";

const DEFAULT_EXPIRY_BUFFER_MS = 30_000;

export interface SupplierTokenGenerator {
  generateToken(): Promise<string>;
}

type Token = { accessToken: string, expiresAt: number }

export class CachedSupplierTokenGenerator implements SupplierTokenGenerator {
  private readonly client: SupplierAuthClient2;
  private readonly expiryBuffer: number;
  private token: Token | null = null;
  private inflightTokenRequest: Promise<string> | null = null;

  constructor(client: SupplierAuthClient2, expiryBuffer: number = DEFAULT_EXPIRY_BUFFER_MS) {
    this.client = client;
    this.expiryBuffer = expiryBuffer;
  }

  async generateToken(): Promise<string> {
    if (this.token && Date.now() < this.token.expiresAt) {
      return this.token.accessToken;
    }
    if (!this.inflightTokenRequest) {
      this.inflightTokenRequest = this.client.getAccessToken().then(token => {
        this.token = {
          accessToken: token.access_token,
          // assuming `expires_in` is in seconds`
          expiresAt: Date.now() + token.expires_in * 1000 - this.expiryBuffer,
        }
        return this.token.accessToken;
      })
      .finally(() => {
        this.inflightTokenRequest = null
      })
    }
    return this.inflightTokenRequest!;
  }
}

const cache: Record<string, SupplierTokenGenerator> = {};

export function getTokenGenerator(config: SupplierConfig, http: HttpClient, secrets: SecretsClient): SupplierTokenGenerator {
  const cacheKey = `${config.clientId}`; // maybe hash the entire json string

  // what happens if multiple requests hit the cache at the same time. We need some kind of lock
  if (!cache[cacheKey]) {
    const client = OAuthSupplierAuthClient2.fromSupplierConfig(http, secrets, config);
    cache[cacheKey] = new CachedSupplierTokenGenerator(client)
  }

  return cache[cacheKey];
}
