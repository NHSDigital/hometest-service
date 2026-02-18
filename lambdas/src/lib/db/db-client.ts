import { Pool } from "pg";

/**
 * A library-agnostic representation of a database result.
 */
export interface DbResult<T> {
  rows: T[];
  rowCount: number | null;
}

export interface DBClient {
  query<T = unknown, I extends unknown[] = unknown[]>(
    text: string,
    values?: I,
  ): Promise<DbResult<T>>;
  close(): Promise<void>;
}

/**
 * Concrete implementation using pg.Pool
 */
export class PostgresDbClient implements DBClient {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString: connectionString,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async query<T = unknown, I extends unknown[] = unknown[]>(
    text: string,
    values?: I,
  ): Promise<DbResult<T>> {
    const result = await this.pool.query(text, values as unknown[]);
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount,
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
