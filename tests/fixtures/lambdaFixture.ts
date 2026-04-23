import { test as base } from "@playwright/test";

import { LambdaInvoker } from "../utils/LambdaInvoker";

type LambdaFixtures = {
  lambdaInvoker: LambdaInvoker;
};

export const lambdaFixture = base.extend<LambdaFixtures>({
  lambdaInvoker: async ({}, use) => {
    await use(new LambdaInvoker());
  },
});
