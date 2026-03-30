import { test as base } from "@playwright/test";

import { TestOrderDbClient } from "../db/TestOrderDbClient";
import { TestResultDbClient } from "../db/TestResultDbClient";

type DbFixtures = {
  testOrderDb: TestOrderDbClient;
  testResultDb: TestResultDbClient;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const dbFixture = base.extend<{}, DbFixtures>({
  testOrderDb: [
    async ({}, use) => {
      const client = new TestOrderDbClient();
      await client.connect();
      await use(client);
      await client.disconnect();
    },
    { scope: "worker" },
  ],
  testResultDb: [
    async ({}, use) => {
      const client = new TestResultDbClient();
      await client.connect();
      await use(client);
      await client.disconnect();
    },
    { scope: "worker" },
  ],
});
