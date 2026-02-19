import { PostgresDbClient } from "../lib/db/db-client";
import { TestResultDbClient } from "../lib/db/test-result-db-client";

export interface Environment {
  testResultDbClient: TestResultDbClient;
}

export function init(): Environment {
  const databaseUrl = process.env.DATABASE_URL!;

  const dbClient = new PostgresDbClient(databaseUrl);
  const testResultDbClient = new TestResultDbClient(dbClient);

  return {
    testResultDbClient,
  };
}
