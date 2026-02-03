import { test as base } from '@playwright/test';
import { FindAddressPage, HomeTestStartPage, EnterAddressManuallyPage, OrderTrackingPage } from '../page-objects';

export interface MyFixtures {
  homeTestStartPage: HomeTestStartPage;
  findAddressPage: FindAddressPage;
  enterAddressManuallyPage: EnterAddressManuallyPage;
  orderTrackingPage: OrderTrackingPage;
}

export const pageObjectFixture = base.extend<MyFixtures>({
  homeTestStartPage: async ({ page }, use) => {
    await use(new HomeTestStartPage(page));
  },

  findAddressPage: async ({ page }, use) => {
    await use(new FindAddressPage(page));
  },

  enterAddressManuallyPage: async ({ page }, use) => {
    await use(new EnterAddressManuallyPage(page));
  },
  
  orderTrackingPage: async ({ page }, use) => {
    await use(new OrderTrackingPage(page));
  },
});

