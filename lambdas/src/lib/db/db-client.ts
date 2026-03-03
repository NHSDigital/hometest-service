<<<<<<< HEAD
import { Pool } from "pg";
import { ConnectionStringProvider } from "./connection-string-provider";
=======
import { Pool, ClientConfig } from "pg";
>>>>>>> 8c47243a733da9c990ea007b2ad300ca1b1f0e72

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
  withTransaction<T>(fn: (client: DBClient) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/**
 * Concrete implementation using pg.Pool
 */
export class PostgresDbClient implements DBClient {
<<<<<<< HEAD
  private readonly poolPromise: Promise<Pool>;

  constructor(connectionStringProvider: ConnectionStringProvider) {
    this.poolPromise = this.createPool(connectionStringProvider);
  }

  private async createPool(
    connectionStringProvider: ConnectionStringProvider,
  ): Promise<Pool> {
    const connectionString =
      await connectionStringProvider.getConnectionString();
    const sslEnabled = connectionStringProvider.getSslEnabled();

    const poolConfig: ConstructorParameters<typeof Pool>[0] = {
      connectionString,
      max: 5,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 60000,
      ssl: sslEnabled ? {
        rejectUnauthorized: false,
      } : false,
    };

    // IAM auth tokens expire after 15 minutes. Supplying password as a function
    // ensures pg.Pool requests a fresh token for every new connection it establishes.
    if (connectionStringProvider.getDynamicPassword) {
      const getDynamicPassword = connectionStringProvider.getDynamicPassword.bind(connectionStringProvider);
      poolConfig.password = () => getDynamicPassword();
    }

    return new Pool(poolConfig);
  }

  private async getPool(): Promise<Pool> {
    return this.poolPromise;
=======
  private readonly pool: Pool;

  constructor(config: ClientConfig) {
    this.pool = this.createPool(config);
  }

  private createPool(config: ClientConfig): Pool {
    return new Pool({
      ...config,
      max: 5,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 60000,
    });
>>>>>>> 8c47243a733da9c990ea007b2ad300ca1b1f0e72
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

  async withTransaction<T>(fn: (client: DBClient) => Promise<T>): Promise<T> {
<<<<<<< HEAD
    const pool = await this.getPool();
    const client = await pool.connect();
=======
    const client = await this.pool.connect();
>>>>>>> 8c47243a733da9c990ea007b2ad300ca1b1f0e72
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
