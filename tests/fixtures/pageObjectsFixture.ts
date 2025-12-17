import { test as base } from '@playwright/test';

import { AboutYouPages } from '../page-objects/AboutYouPages/AboutYouPagesHelper';
import { AlcoholConsumptionPages } from '../page-objects/AlcoholConsumptionPages/AlcoholConsumptionPagesHelper';
import { BloodPressurePages } from '../page-objects/BloodPressurePages/BloodPressurePagesHelper';
import { BloodTestPages } from '../page-objects/BloodTestPages/BloodTestPagesHelper';
import { BodyMeasurementsPages } from '../page-objects/BodyMeasurementsPages/BodyMeasurementsPagesHelper';
import { DeclarationPages } from '../page-objects/DeclarationPages/DeclarationPagesHelper';
import { PhysicalActivityPages } from '../page-objects/PhysicalActivityPages/PhysicalActivityPagesHelper';
import { NhsLoginPages } from '../page-objects/NHSLogin/NhsLoginPagesHelper';
import { ResultsPages } from '../page-objects/ResultsPages/ResultsPagesHelper';
import { EligibilityPages } from '../page-objects/EligibilityPages/EligibilityPagesHelper';
import { CompleteHealthCheckFirstPage } from '../page-objects/CompleteHealthCheckFirstPage';
import { ConsentNotGivenErrorPage } from '../page-objects/ConsentNotGivenErrorPage';
import { HealthCheckExpiredPage } from '../page-objects/HealthCheckExpiredPage';
import { HealthCheckVersionMigrationPage } from '../page-objects/HealthCheckVersionMigrationPage/HealthCheckVersionMigrationPage';
import { LogoutPage } from '../page-objects/LogoutPage';
import { NhsLoginError } from '../page-objects/NhsLoginError';
import { NotEligiblePage } from '../page-objects/NotEligiblePage';
import { OdsNhsNumberNotEligiblePage } from '../page-objects/OdsNhsNumberNotEligiblePage';
import { TaskListPage } from '../page-objects/TaskListPage';
import { TermsAndConditionsPage } from '../page-objects/TermsAndConditionsPage/TermsAndConditionsPage';
import { WafErrorPage } from '../page-objects/WafErrorPage';
import { SubmitAndReviewPages } from '../page-objects/SubmitAndReviewPages/SubmitAndReviewPagesHelper';
import { AboutThisSoftwarePage } from '../page-objects/AboutThisSoftwarePage';

export interface MyFixtures {
  aboutYouPages: AboutYouPages;
  alcoholConsumptionPages: AlcoholConsumptionPages;
  bloodPressurePages: BloodPressurePages;
  bloodTestPages: BloodTestPages;
  bodyMeasurementPages: BodyMeasurementsPages;
  declarationPages: DeclarationPages;
  physicalActivityPages: PhysicalActivityPages;
  nhsLoginPages: NhsLoginPages;
  eligibilityPages: EligibilityPages;
  resultsPages: ResultsPages;
  wafErrorPage: WafErrorPage;

  submitAndReviewPages: SubmitAndReviewPages;
  taskListPage: TaskListPage;
  termsAndConditionsPage: TermsAndConditionsPage;
  healthCheckVersionMigrationPage: HealthCheckVersionMigrationPage;
  notEligiblePage: NotEligiblePage;
  completeHealthCheckFirstPage: CompleteHealthCheckFirstPage;
  consentNotGivenErrorPage: ConsentNotGivenErrorPage;
  nhsLoginError: NhsLoginError;
  logoutPage: LogoutPage;
  healthCheckExpiredPage: HealthCheckExpiredPage;
  odsNhsNumberNotEligiblePage: OdsNhsNumberNotEligiblePage;
  aboutThisSoftwarePage: AboutThisSoftwarePage;
}

export const pageObjectFixture = base.extend<MyFixtures>({
  aboutYouPages: async ({ page }, use) => {
    await use(new AboutYouPages(page));
  },
  alcoholConsumptionPages: async ({ page }, use) => {
    await use(new AlcoholConsumptionPages(page));
  },
  bloodPressurePages: async ({ page }, use) => {
    await use(new BloodPressurePages(page));
  },
  bloodTestPages: async ({ page }, use) => {
    await use(new BloodTestPages(page));
  },
  bodyMeasurementPages: async ({ page }, use) => {
    await use(new BodyMeasurementsPages(page));
  },
  declarationPages: async ({ page }, use) => {
    await use(new DeclarationPages(page));
  },
  physicalActivityPages: async ({ page }, use) => {
    await use(new PhysicalActivityPages(page));
  },
  nhsLoginPages: async ({ page }, use) => {
    await use(new NhsLoginPages(page));
  },
  eligibilityPages: async ({ page }, use) => {
    await use(new EligibilityPages(page));
  },
  resultsPages: async ({ page }, use) => {
    await use(new ResultsPages(page));
  },
  submitAndReviewPages: async ({ page }, use) => {
    await use(new SubmitAndReviewPages(page));
  },

  // WAF Error Page

  wafErrorPage: async ({ page }, use) => {
    await use(new WafErrorPage(page));
  },

  // Other pages

  taskListPage: async ({ page }, use) => {
    await use(new TaskListPage(page));
  },
  termsAndConditionsPage: async ({ page }, use) => {
    await use(new TermsAndConditionsPage(page));
  },
  healthCheckVersionMigrationPage: async ({ page }, use) => {
    await use(new HealthCheckVersionMigrationPage(page));
  },
  completeHealthCheckFirstPage: async ({ page }, use) => {
    await use(new CompleteHealthCheckFirstPage(page));
  },
  notEligiblePage: async ({ page }, use) => {
    await use(new NotEligiblePage(page));
  },
  consentNotGivenErrorPage: async ({ page }, use) => {
    await use(new ConsentNotGivenErrorPage(page));
  },
  nhsLoginError: async ({ page }, use) => {
    await use(new NhsLoginError(page));
  },
  logoutPage: async ({ page }, use) => {
    await use(new LogoutPage(page));
  },
  healthCheckExpiredPage: async ({ page }, use) => {
    await use(new HealthCheckExpiredPage(page));
  },
  odsNhsNumberNotEligiblePage: async ({ page }, use) => {
    await use(new OdsNhsNumberNotEligiblePage(page));
  },
  aboutThisSoftwarePage: async ({ page }, use) => {
    await use(new AboutThisSoftwarePage(page));
  }
});
