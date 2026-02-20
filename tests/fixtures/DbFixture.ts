import { test as base } from '@playwright/test';
import { TestOrderDbClient } from '../db/TestOrderDbClient';

type DbFixtures = {
  testOrderDb: TestOrderDbClient;
};

export const dbFixture = base.extend<DbFixtures>({
  testOrderDb: async ({}, use) => {
    const client = new TestOrderDbClient();
    await client.connect();
    await use(client);
    await client.disconnect();
  },
});
