import { test as base } from '@playwright/test';
import { HomeTestStartPage } from '../page-objects';

export interface MyFixtures {
  homeTestStartPage: HomeTestStartPage;
}

export const pageObjectFixture = base.extend<MyFixtures>({
  homeTestStartPage: async ({ page }, use) => {
    await use(new HomeTestStartPage(page));
  },
});
