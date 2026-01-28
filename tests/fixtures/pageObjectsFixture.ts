import { test as base } from '@playwright/test';
import { FindAddressPage, HomeTestPage, EnterAddressManuallyPage } from '../page-objects';

export interface MyFixtures {
  homeTestPage: HomeTestPage;
  findAddressPage: FindAddressPage;
  enterAddressManuallyPage: EnterAddressManuallyPage;
}

export const pageObjectFixture = base.extend<MyFixtures>({
  homeTestPage: async ({ page }, use) => {
    await use(new HomeTestPage(page));
  },

  findAddressPage: async ({ page }, use) => {
    await use(new FindAddressPage(page));
  },

  enterAddressManuallyPage: async ({ page }, use) => {
    await use(new EnterAddressManuallyPage(page));
  }
});

