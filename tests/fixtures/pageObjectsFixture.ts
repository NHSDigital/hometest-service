import { test as base } from '@playwright/test';
import { FindAddressPage, HomeTestStartPage, EnterAddressManuallyPage, SelectDeliveryAddressPage, OrderStatusPage, HowComfortablePrickingFingerPage, PrivacyPolicyPage, BloodSampleGuidePage } from '../page-objects';

export interface MyFixtures {
  homeTestStartPage: HomeTestStartPage;
  findAddressPage: FindAddressPage;
  enterAddressManuallyPage: EnterAddressManuallyPage;
  selectDeliveryAddressPage: SelectDeliveryAddressPage;
  orderStatusPage: OrderStatusPage;
  howComfortablePrickingFingerPage: HowComfortablePrickingFingerPage;
  privacyPolicyPage: PrivacyPolicyPage;
  bloodSampleGuidePage: BloodSampleGuidePage;
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

  selectDeliveryAddressPage: async ({ page }, use) => {
    await use(new SelectDeliveryAddressPage(page));
  },

  orderStatusPage: async ({ page }, use) => {
    await use(new OrderStatusPage(page));
  },

  howComfortablePrickingFingerPage: async ({ page }, use) => {
    await use(new HowComfortablePrickingFingerPage(page));
  },

  privacyPolicyPage: async ({ page }, use) => {
    await use(new PrivacyPolicyPage(page));
  },

  bloodSampleGuidePage: async ({ page }, use) => {
    await use(new BloodSampleGuidePage(page));
  },
});
