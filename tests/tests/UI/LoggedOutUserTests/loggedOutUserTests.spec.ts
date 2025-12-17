import { test } from '../../../fixtures/commonFixture';
import checkEligibleUserMockRediractionPageTest from './checkEligibleUserMockRedirectionPage';
import initialScreensAccessibilityTest from './initialScreensAccessibilityTest';
import logoutPageAccessibilityTest from './logoutPageAccessibilityTest';
import { type Config, ConfigFactory } from '../../../env/config';
import { disabledOdsCodeTest } from './patientOdsCodeDisabled';
import { updatePatientDataAfterLoginTest } from './updatePatientDataAfterLogin';
import checkEligibleUserNhsRedirectionPageTest from './checkEligibleUserNhsRedirectionPage';
import { healthCheckVersionMigrationTests } from './healthCheckVersionMigrationTests';
import checkUserCanLoginFromNudgeAndUrlSourceIsCapturedInAuditEventDetails from './loginFromNudgeUrl';
import checkNewUserCanLoginFromInviteOrReminderAndUrlSourceIsCapturedInAuditEventDetails from './newUserLoginFromInviteOrReminderUrl';
import {
  logoutPageTestForIntegratedEnv,
  logoutPageTestForMock
} from './logoutPage';

const config: Config = ConfigFactory.getConfig();

test.describe('Logout page tests - mock', () => {
  test.skip(config.integratedEnvironment);
  logoutPageTestForMock();
});

test.describe('Logout page tests - integrated', () => {
  test.skip(!config.integratedEnvironment);
  logoutPageTestForIntegratedEnv();
});

test.describe('Check eligible user mock rediraction page test', () => {
  test.skip(config.integratedEnvironment);
  checkEligibleUserMockRediractionPageTest();
});

test.describe('Logout page accessibility test', () => {
  test.skip(config.integratedEnvironment);
  logoutPageAccessibilityTest();
});

test.describe('Initial screens accessibility test', () => {
  test.skip(config.integratedEnvironment);
  initialScreensAccessibilityTest();
});

test.describe('Disabled ODS code test', () => {
  test.skip(config.integratedEnvironment);
  disabledOdsCodeTest();
});

test.describe('Update patient data test', () => {
  updatePatientDataAfterLoginTest();
});

test.describe('Eligible user redirection page tests with NHS Login', () => {
  checkEligibleUserNhsRedirectionPageTest();
});

test.describe('Health Check Version Migration tests', () => {
  healthCheckVersionMigrationTests();
});

test.describe('Login from nudge Url', () => {
  test.skip(!config.integratedEnvironment);
  checkUserCanLoginFromNudgeAndUrlSourceIsCapturedInAuditEventDetails();
});

test.describe('New user login from invite or reminder url', () => {
  checkNewUserCanLoginFromInviteOrReminderAndUrlSourceIsCapturedInAuditEventDetails();
});
