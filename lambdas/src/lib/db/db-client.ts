import { Pool } from "pg";
import { ConnectionStringProvider } from "./connection-string-provider";

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
  private readonly poolPromise: Promise<Pool>;

  constructor(connectionStringProvider: ConnectionStringProvider) {
    this.poolPromise = this.createPool(connectionStringProvider);
  }

  private async createPool(
    connectionStringProvider: ConnectionStringProvider,
  ): Promise<Pool> {
    const connectionString =
      await connectionStringProvider.getConnectionString();
    return new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 60000,

      ssl: {
        rejectUnauthorized: false, // <-- THIS is where you set it
      },
    });
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

  async withTransaction<T>(fn: (client: DBClient) => Promise<T>): Promise<T> {
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
