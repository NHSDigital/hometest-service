import { test as base } from '@playwright/test';
import { FindAddressPage, HomeTestPage } from '../page-objects';

export interface MyFixtures {
  homeTestPage: HomeTestPage;
  findAddressPage: FindAddressPage;

}

export const pageObjectFixture = base.extend<MyFixtures>({
  homeTestPage: async ({ page }, use) => {
    await use(new HomeTestPage(page));
  },
  findAddressPage: async ({ homeTestPage }, use) => {
    await use(new FindAddressPage(homeTestPage));
  }
});
