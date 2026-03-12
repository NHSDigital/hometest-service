import { test as base } from "@playwright/test";

// Page Objects
import { HomeTestStartPage } from "../page-objects/HomeTestStartPage";
import { EnterDeliveryAddressPage } from "../page-objects/EnterDeliveryAddressPage";
import { BloodSampleGuidePage } from "../page-objects/BloodSampleGuidePage";
import { CheckYourAnswersPage } from "../page-objects/CheckYourAnswersPage";
import { EnterAddressManuallyPage } from "../page-objects/EnterAddressManuallyPage";
import { SelectDeliveryAddressPage } from "../page-objects/SelectDeliveryAddressPage";
import { OrderStatusPage } from "../page-objects/OrderStatusPage";
import { HowComfortablePrickingFingerPage } from "../page-objects/HowComfortablePrickingFingerPage";
import { PrivacyPolicyPage } from "../page-objects/PrivacyPolicyPage";
import { ConfirmMobileNumberPage } from "../page-objects/ConfirmMobileNumberPage";
import { NegativeResultPage } from "../page-objects/NegativeResultPage";
import { NHSEmailAndPasswordPage } from "../page-objects/NHSLogin/NHSEmailAndPasswordPage";
import { ErrorPage } from "../page-objects/ErrorPage";
import { KitNotAvailableInYourAreaPage } from "../page-objects/KitNotAvailableInYourAreaPage";
import { OrderSubmittedPage } from "../page-objects/OrderSubmittedPage";
import { CodeSecurityPage } from "../page-objects/NHSLogin/CodeSecurityPage";
import { SuppliersTermsOfUsePage } from "../page-objects/SuppliersTermsOfUsePage";
import { CannotUseServiceUnder18Page } from "../page-objects/CannotUseServiceUnder18Page";
import { GoToClinicPage } from "../page-objects/GoToClinicPage";
import { SuppliersPrivacyPolicyPage } from "../page-objects/SuppliersPrivacyPolicyPage";

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
  kitNotAvailableInYourAreaPage: KitNotAvailableInYourAreaPage;
  nhsEmailAndPasswordPage: NHSEmailAndPasswordPage;
  errorPage: ErrorPage;
  checkYourAnswersPage: CheckYourAnswersPage;
  orderSubmittedPage: OrderSubmittedPage;
  codeSecurityPage: CodeSecurityPage;
  suppliersTermsOfUsePage: SuppliersTermsOfUsePage;
  cannotUseServiceUnder18Page: CannotUseServiceUnder18Page;
  goToClinicPage: GoToClinicPage;
  suppliersPrivacyPolicyPage: SuppliersPrivacyPolicyPage;
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

  codeSecurityPage: async ({ page }, use) => {
    await use(new CodeSecurityPage(page));
  },

  suppliersTermsOfUsePage: async ({ page }, use) => {
    await use(new SuppliersTermsOfUsePage(page));
  },

  goToClinicPage: async ({ page }, use) => {
    await use(new GoToClinicPage(page));
  },

  cannotUseServiceUnder18Page: async ({ page }, use) => {
    await use(new CannotUseServiceUnder18Page(page));
  },

  suppliersPrivacyPolicyPage: async ({ page }, use) => {
    await use(new SuppliersPrivacyPolicyPage(page));
  },
});
