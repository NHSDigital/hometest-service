import { ClientConfig, Pool } from "pg";

/**
 * A library-agnostic representation of a database result.
 */
export interface DbResult<T> {
  rows: T[];
  rowCount: number | null;
}

export interface DBClient {
  query<T = any, I extends any[] = any[]>(text: string, values?: I): Promise<DbResult<T>>;
  withTransaction<T>(fn: (client: DBClient) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/**
 * Concrete implementation using pg.Pool
 */
export class PostgresDbClient implements DBClient {
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
  }

  async query<T = any, I extends any[] = any[]>(text: string, values?: I): Promise<DbResult<T>> {
    const result = await this.pool.query(text, values as any[]);
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount,
    };
  }

  async withTransaction<T>(fn: (client: DBClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
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
      withTransaction: async <U>(nestedFn: (client: DBClient) => Promise<U>) => nestedFn(txClient),
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
    await this.pool.end();
  }
}
