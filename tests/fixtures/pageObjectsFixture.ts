import { test as base } from "@playwright/test";
import { HomeTestStartPage } from "../page-objects/HomeTestStartPage";
import { EnterDeliveryAddressPage } from "../page-objects/EnterDeliveryAddressPage";
import { EnterAddressManuallyPage } from "../page-objects/EnterAddressManuallyPage";
import { SelectDeliveryAddressPage } from "../page-objects/SelectDeliveryAddressPage";
import { OrderStatusPage } from "../page-objects/OrderStatusPage";
import { HowComfortablePrickingFingerPage } from "../page-objects/HowComfortablePrickingFingerPage";
import { BloodSampleGuidePage } from "../page-objects/BloodSampleGuidePage";
import { PrivacyPolicyPage } from "../page-objects/PrivacyPolicyPage";
import { ConfirmMobileNumberPage } from "../page-objects/ConfirmMobileNumberPage";
import { NegativeResultPage } from "../page-objects/NegativeResultPage";
import { NHSEmailAndPasswordPage } from "../page-objects/NHSLogin/NHSEmailAndPasswordPage";
import { ErrorPage } from "../page-objects/ErrorPage";
import { CheckYourAnswersPage } from "../page-objects/CheckYourAnswersPage";
import { OrderSubmittedPage } from "../page-objects/OrderSubmittedPage";

export interface MyFixtures {
  homeTestStartPage: HomeTestStartPage;
  enterDeliveryAddressPage: EnterDeliveryAddressPage;
  enterAddressManuallyPage: EnterAddressManuallyPage;
  selectDeliveryAddressPage: SelectDeliveryAddressPage;
  orderStatusPage: OrderStatusPage;
  howComfortablePrickingFingerPage: HowComfortablePrickingFingerPage;
  privacyPolicyPage: PrivacyPolicyPage;
  bloodSampleGuidePage: BloodSampleGuidePage;
  confirmMobileNumberPage: ConfirmMobileNumberPage;
  negativeResultPage: NegativeResultPage;
  nhsEmailAndPasswordPage: NHSEmailAndPasswordPage;
  errorPage: ErrorPage;
  checkYourAnswersPage: CheckYourAnswersPage;
  orderSubmittedPage: OrderSubmittedPage;
}

export const pageObjectFixture = base.extend<MyFixtures>({
  homeTestStartPage: async ({ page }, use) => {
    await use(new HomeTestStartPage(page));
  },

  enterDeliveryAddressPage: async ({ page }, use) => {
    await use(new EnterDeliveryAddressPage(page));
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

  confirmMobileNumberPage: async ({ page }, use) => {
    await use(new ConfirmMobileNumberPage(page));
  },

  negativeResultPage: async ({ page }, use) => {
    await use(new NegativeResultPage(page));
  },

  nhsEmailAndPasswordPage: async ({ page }, use) => {
    await use(new NHSEmailAndPasswordPage(page));
  },

  errorPage: async ({ page }, use) => {
    await use(new ErrorPage(page));
  },

  checkYourAnswersPage: async ({ page }, use) => {
    await use(new CheckYourAnswersPage(page));
  },

  orderSubmittedPage: async ({ page }, use) => {
    await use(new OrderSubmittedPage(page));
  },
});
