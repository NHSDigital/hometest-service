import { BloodSampleGuidePage } from "../page-objects/BloodSampleGuidePage";
import { CheckYourAnswersPage } from "../page-objects/CheckYourAnswersPage";
import { ConfirmAndUpdateMobileNumberPage } from "../page-objects/ConfirmAndUpdateMobileNumberPage";
import { EnterAddressManuallyPage } from "../page-objects/EnterAddressManuallyPage";
import { EnterMobileNumberPage } from "../page-objects/EnterMobileNumberPage";
import { ErrorPage } from "../page-objects/ErrorPage";
import { FindAddressPage } from "../page-objects/FindAddressPage";
import { HomeTestStartPage } from "../page-objects/HomeTestStartPage";
import { HowComfortablePrickingFingerPage } from "../page-objects/HowComfortablePrickingFingerPage";
import { KitNotAvailableInYourAreaPage } from "../page-objects/KitNotAvailableInYourAreaPage";
import { NHSEmailAndPasswordPage } from "../page-objects/NHSLogin/NHSEmailAndPasswordPage";
import { NegativeResultPage } from "../page-objects/NegativeResultPage";
import { OrderStatusPage } from "../page-objects/OrderStatusPage";
import { OrderSubmittedPage } from "../page-objects/OrderSubmittedPage";
import { PrivacyPolicyPage } from "../page-objects/PrivacyPolicyPage";
import { SelectDeliveryAddressPage } from "../page-objects/SelectDeliveryAddressPage";
import { SuppliersTermsOfUsePage } from "../page-objects/SuppliersTermsOfUsePage";
import { test as base } from "@playwright/test";

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
  kitNotAvailableInYourAreaPage: KitNotAvailableInYourAreaPage;
  nhsEmailAndPasswordPage: NHSEmailAndPasswordPage;
  errorPage: ErrorPage;
  checkYourAnswersPage: CheckYourAnswersPage;
  orderSubmittedPage: OrderSubmittedPage;
  suppliersTermsOfUsePage: SuppliersTermsOfUsePage;
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

  kitNotAvailableInYourAreaPage: async ({ page }, use) => {
    await use(new KitNotAvailableInYourAreaPage(page));
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

  suppliersTermsOfUsePage: async ({ page }, use) => {
    await use(new SuppliersTermsOfUsePage(page));
  },
});
