import { Pool } from "pg";
import type { SecretsClient } from "../secrets/secrets-manager-client";

/**
 * A library-agnostic representation of a database result.
 */
export interface DbResult<T> {
  rows: T[];
  rowCount: number | null;
}

export interface DBClient {
  query<T = any, I extends any[] = any[]>(
    text: string,
    values?: I,
  ): Promise<DbResult<T>>;
  withTransaction<T>(
    fn: (client: DBClient) => Promise<T>,
  ): Promise<T>;
  close(): Promise<void>;
}

export interface PostgresDbClientConfig {
  username: string;
  address: string;
  port: string;
  database: string;
  schema?: string;
  passwordSecretName: string;
}

/**
 * Concrete implementation using pg.Pool
 */
export class PostgresDbClient implements DBClient {
  private pool: Pool | null = null;
  private readonly poolPromise: Promise<Pool>;
  private readonly config: PostgresDbClientConfig;
  private readonly secretsClient: SecretsClient;

  constructor(config: PostgresDbClientConfig, secretsClient: SecretsClient) {
    this.config = config;
    this.secretsClient = secretsClient;
    this.poolPromise = this.createPool();
  }

  private async createPool(): Promise<Pool> {
    const password = await this.secretsClient.getSecretValue(
      this.config.passwordSecretName,
    );
    const connectionString = this.buildConnectionString(password);
    const pool = new Pool({
      connectionString: connectionString,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    this.pool = pool;
    return pool;
  }

  private buildConnectionString(password: string): string {
    const username = encodeURIComponent(this.config.username);
    // Trim whitespace and remove surrounding quotes
    const sanitisedPassword = password.trim().replace(/^["']|["']$/g, '');
    const encodedPassword = encodeURIComponent(sanitisedPassword);
    const address = this.config.address;
    const port = this.config.port;
    const database = this.config.database;
    const base = `postgresql://${username}:${encodedPassword}@${address}:${port}/${database}`;

    if (!this.config.schema) {
      return base;
    }

    const options = encodeURIComponent(`-c search_path=${this.config.schema}`);
    return `${base}?options=${options}`;
  }

  private async getPool(): Promise<Pool> {
    return this.poolPromise;
  }

  async query<T = any, I extends any[] = any[]>(
    text: string,
    values?: I,
  ): Promise<DbResult<T>> {
    const pool = await this.getPool();
    const result = await pool.query(text, values as any[]);
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount,
    };
  }

  async withTransaction<T>(
    fn: (client: DBClient) => Promise<T>,
  ): Promise<T> {
    const pool = await this.getPool();
    const client = await pool.connect();
    const txClient: DBClient = {
      query: async <Q = any, I extends any[] = any[]>(
        text: string,
        values?: I,
      ): Promise<DbResult<Q>> => {
        const result = await client.query(text, values as any[]);
        return {
          rows: result.rows as Q[],
          rowCount: result.rowCount,
        };
      },
      withTransaction: async <U>(nestedFn: (client: DBClient) => Promise<U>) =>
        nestedFn(txClient),
      close: async () => undefined,
    };

    try {
      await client.query("BEGIN");
      const result = await fn(txClient);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Failed to rollback transaction", { rollbackError });
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    const pool = await this.getPool();
    await pool.end();
  }
}
