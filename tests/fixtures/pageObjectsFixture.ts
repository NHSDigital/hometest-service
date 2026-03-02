import { test as base } from '@playwright/test';
import { HomeTestStartPage } from '../page-objects/HomeTestStartPage';
import { FindAddressPage } from '../page-objects/FindAddressPage';
import { EnterAddressManuallyPage } from '../page-objects/EnterAddressManuallyPage';
import { SelectDeliveryAddressPage } from '../page-objects/SelectDeliveryAddressPage';
import { OrderStatusPage } from '../page-objects/OrderStatusPage';
import { HowComfortablePrickingFingerPage } from '../page-objects/HowComfortablePrickingFingerPage';
import { BloodSampleGuidePage } from '../page-objects/BloodSampleGuidePage';
import { EnterMobileNumberPage } from '../page-objects/EnterMobileNumberPage';
import { PrivacyPolicyPage } from '../page-objects/PrivacyPolicyPage';
import { ConfirmAndUpdateMobileNumberPage } from '../page-objects/ConfirmAndUpdateMobileNumberPage';
import { NegativeResultPage } from '../page-objects/NegativeResultPage';
import { CheckYourAnswersPage } from '../page-objects/CheckYourAnswersPage';
import { OrderSubmittedPage } from '../page-objects/OrderSubmittedPage';

export interface MyFixtures {
  homeTestStartPage: HomeTestStartPage;
  findAddressPage: FindAddressPage;
  enterAddressManuallyPage: EnterAddressManuallyPage;
  selectDeliveryAddressPage: SelectDeliveryAddressPage;
  orderStatusPage: OrderStatusPage;
  howComfortablePrickingFingerPage: HowComfortablePrickingFingerPage;
  privacyPolicyPage: PrivacyPolicyPage;
  bloodSampleGuidePage: BloodSampleGuidePage;
  enterMobileNumberPage: EnterMobileNumberPage;
  confirmAndUpdateMobileNumberPage: ConfirmAndUpdateMobileNumberPage;
  negativeResultPage: NegativeResultPage;
  checkYourAnswersPage: CheckYourAnswersPage;
  orderSubmittedPage: OrderSubmittedPage;
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

  enterMobileNumberPage: async ({ page }, use) => {
    await use(new EnterMobileNumberPage(page));
  },

  confirmAndUpdateMobileNumberPage: async ({ page }, use) => {
    await use(new ConfirmAndUpdateMobileNumberPage(page));
  },

  negativeResultPage: async ({ page }, use) => {
    await use(new NegativeResultPage(page));

  },
    
  checkYourAnswersPage: async ({ page }, use) => {
    await use(new CheckYourAnswersPage(page));
  },

  orderSubmittedPage: async ({ page }, use) => {
    await use(new OrderSubmittedPage(page));
  },
});
