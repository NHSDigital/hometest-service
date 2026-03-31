import { Pool } from "pg";

import { EnvironmentVariables } from "../configuration/EnvironmentConfiguration";

export class BaseDbClient {
  private pool: Pool;

  constructor() {
    const schema = process.env[EnvironmentVariables.DB_SCHEMA] ?? "hometest";
    this.pool = new Pool({
      host: process.env[EnvironmentVariables.DB_HOST] ?? "localhost",
      port: parseInt(process.env[EnvironmentVariables.DB_PORT] ?? "5432", 10),
      database: process.env[EnvironmentVariables.DB_NAME] ?? "local_hometest_db",
      user: process.env[EnvironmentVariables.DB_USER] ?? "admin",
      password: process.env[EnvironmentVariables.DB_PASSWORD] ?? "admin",
      options: `-c search_path=${schema}`,
      max: 3,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  async connect(): Promise<void> {
    // Test connection by acquiring and releasing a client
    const client = await this.pool.connect();
    client.release();
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }

  protected async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    console.log(`[DB QUERY] ${sql}`, params);
    const result = await this.pool.query(sql, params);
    return result.rows as T[];
  }
}
