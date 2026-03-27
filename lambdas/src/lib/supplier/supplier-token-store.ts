import { DBClient } from "../db/db-client";
import { TokenEncryptionClient } from "../kms/kms-client";

export interface CachedSupplierToken {
  accessToken: string;
  expiresAtMs: number;
}

export interface TokenStore {
  get(key: string): Promise<CachedSupplierToken | null>;
  set(key: string, token: CachedSupplierToken): Promise<void>;
}

export class InMemoryTokenStore implements TokenStore {
  private readonly store: Record<string, CachedSupplierToken> = {};

  async get(key: string): Promise<CachedSupplierToken | null> {
    return this.store[key] || null;
  }

  async set(key: string, token: CachedSupplierToken): Promise<void> {
    this.store[key] = token;
  }
}

interface SupplierTokenCacheRow {
  access_token: string;
  expires_at: string;
}

export class PostgresTokenStore implements TokenStore {
  constructor(
    private readonly dbClient: DBClient,
    private readonly encryptionClient: TokenEncryptionClient,
  ) {}

  async get(key: string): Promise<CachedSupplierToken | null> {
    try {
      const result = await this.dbClient.query<SupplierTokenCacheRow, [string]>(
        `SELECT access_token, expires_at
         FROM supplier_token_cache
         WHERE cache_key = $1
           AND expires_at > NOW() + INTERVAL '30 seconds'`,
        [key],
      );

      if (!result.rowCount || result.rowCount < 1) {
        return null;
      }

      const row = result.rows[0];
      const accessToken = await this.encryptionClient.decrypt(row.access_token);

      return {
        accessToken,
        expiresAtMs: new Date(row.expires_at).getTime(),
      };
    } catch (_error) {
      // Best-effort cache: if DB/KMS is unavailable, fall back to fresh OAuth token retrieval.
      return null;
    }
  }

  async set(key: string, token: CachedSupplierToken): Promise<void> {
    const encryptedAccessToken = await this.encryptionClient.encrypt(token.accessToken);

    await this.dbClient.query(
      `INSERT INTO supplier_token_cache (cache_key, access_token, expires_at)
       VALUES ($1, $2, to_timestamp($3 / 1000.0))
       ON CONFLICT (cache_key)
       DO UPDATE SET
         access_token = EXCLUDED.access_token,
         expires_at = EXCLUDED.expires_at,
         created_at = CURRENT_TIMESTAMP`,
      [key, encryptedAccessToken, token.expiresAtMs],
    );
  }
}
