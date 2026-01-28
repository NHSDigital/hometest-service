import { test as base } from '@playwright/test';
import { FindAddressPage, HomeTestStartPage } from '../page-objects';

export interface MyFixtures {
  findAddressPage: FindAddressPage;
  homeTestStartPage: HomeTestStartPage;
}

export const pageObjectFixture = base.extend<MyFixtures>({
  homeTestStartPage: async ({ page }, use) => {
    await use(new HomeTestStartPage(page));
  },

  findAddressPage: async ({ page }, use) => {
    await use(new FindAddressPage(page));
  }
});

