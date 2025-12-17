import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import NhsLoginHelper from '../../../page-objects/NhsLoginHelper';
import {
  getPatientDbItem,
  TermsAndConditionsLatestVersion
} from '../../../testData/patientTestData';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../../testData/healthCheck/healthCheckFactory';
import type {
  BaseTestUser,
  NHSLoginMockedUser,
  NHSLoginUser
} from '../../../lib/users/BaseUser';
import { SpecialUserKey } from '../../../lib/users/SpecialUserKey';

let nhsLoginHelper: NhsLoginHelper;

const config: Config = ConfigFactory.getConfig();

const changedOds = `changed_ods${Math.round(Math.random() * 10000)}`;
const changedDoB = '1111-11-11';
let eligibleUser: BaseTestUser;

export function updatePatientDataAfterLoginTest() {
  test.beforeEach(
    async ({
      context,
      testedUser,
      dynamoDBServiceUtils,
      dbPatientService,
      userManager
    }) => {
      if (!config.integratedEnvironment) {
        eligibleUser = testedUser;
      } else {
        eligibleUser = userManager.getSpecialUser(
          SpecialUserKey.LOGOUT_DEDICATED_USER
        );
      }

      await context.clearCookies();
      await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
        eligibleUser,
        HealthCheckFactory.createHealthCheck(
          testedUser,
          HealthCheckType.INITIAL
        )
      );

      // cleanup and create a new patient
      await dbPatientService.deletePatientItemByNhsNumber(
        eligibleUser.nhsNumber
      );
      const patient = getPatientDbItem(
        eligibleUser.nhsNumber,
        eligibleUser.patientId,
        changedOds,
        TermsAndConditionsLatestVersion
      );
      patient.dateOfBirth = changedDoB;
      await dbPatientService.createPatient(patient);

      nhsLoginHelper = new NhsLoginHelper();
    }
  );

  test('Verify if ODS code and Dob were updated after login', async ({
    page,
    taskListPage,
    nhsLoginPages,
    dbPatientService
  }) => {
    await test.step('Login to the system and go to TaskList page', async () => {
      if (!config.integratedEnvironment) {
        await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
          (eligibleUser as NHSLoginMockedUser).code
        );
      } else {
        await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppUrlAndClickContinue();
        await nhsLoginPages.nhsAppRedirectorPage.waitUntilLoadedAndClickContinue();
        await nhsLoginHelper.fillNhsLoginFormsAndWaitForNextPage(
          eligibleUser as NHSLoginUser,
          page
        );
      }
      await taskListPage.waitUntilLoaded();
    });

    await test.step('Check if OdsCode and DoB were updated after login', async () => {
      const patientDbItem = await dbPatientService.getPatientItemByNhsNumber(
        eligibleUser.nhsNumber
      );

      expect(patientDbItem.gpOdsCode).not.toEqual(changedOds);
      expect(patientDbItem.dateOfBirth).not.toEqual(changedDoB);
    });
  });
}
