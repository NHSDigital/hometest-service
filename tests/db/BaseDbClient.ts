import { Client } from 'pg';
import { EnvironmentVariables } from '../configuration/configuration';

export class BaseDbClient {
  client: Client;

  constructor() {
    this.client = new Client({
      host:     process.env[EnvironmentVariables.DB_HOST]     ?? 'localhost',
      port:     parseInt(process.env[EnvironmentVariables.DB_PORT] ?? '5432', 10),
      database: process.env[EnvironmentVariables.DB_NAME]     ?? 'local_hometest_db',
      user:     process.env[EnvironmentVariables.DB_USER]     ?? 'admin',
      password: process.env[EnvironmentVariables.DB_PASSWORD] ?? 'admin',
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.end();
  }

  protected async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    console.log(`[DB QUERY] ${sql}`, params);
    const result = await this.client.query(sql, params);
    return result.rows as T[];
  }
}
