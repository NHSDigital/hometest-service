import { test, expect } from '../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../env/config';
import { type GetFunctionCommandOutput } from '@aws-sdk/client-lambda';
import type { NHSLoginMockedUser } from '../../lib/users/BaseUser';
import { SpecialUserKey } from '../../lib/users/SpecialUserKey';

let defaultLambdaConfig: GetFunctionCommandOutput;
let defaultNhsNumberCheckValue: string;
let mockedNotWhitelistedNhsNumber: NHSLoginMockedUser;

const config: Config = ConfigFactory.getConfig();
const loginLambdaName = `${config.name}NhcLoginLambda`;

test.describe('Patient with not whitelisted NHS Number and login toggle disabled', () => {
  test.skip(config.integratedEnvironment);
  test.beforeEach(
    async ({
      lambdaService,
      dbHealthCheckService,
      dbPatientService,
      userManager
    }) => {
      defaultLambdaConfig =
        await lambdaService.getLambdaConfiguration(loginLambdaName);
      defaultNhsNumberCheckValue = defaultLambdaConfig.Configuration
        ?.Environment?.Variables?.ENABLE_NHS_NUMBER_CHECK as unknown as string;

      mockedNotWhitelistedNhsNumber = userManager.getSpecialUser(
        SpecialUserKey.NOT_WHITELISTED_NHS_NUMBER
      ) as NHSLoginMockedUser;

      await dbHealthCheckService.deleteItemByNhsNumber(
        mockedNotWhitelistedNhsNumber.nhsNumber
      );

      await dbPatientService.deletePatientItemByNhsNumber(
        mockedNotWhitelistedNhsNumber.nhsNumber
      );

      if (defaultNhsNumberCheckValue === 'true') {
        await lambdaService.updateLambdaVariable(
          loginLambdaName,
          'ENABLE_NHS_NUMBER_CHECK',
          `false`
        );
      }
    }
  );

  test.afterEach(async ({ lambdaService }) => {
    await lambdaService.updateLambdaVariable(
      loginLambdaName,
      'ENABLE_NHS_NUMBER_CHECK',
      defaultNhsNumberCheckValue
    );
  });

  test('Verify if Patient with not whitelisted NHS Number is able to login, when login toggle is set to false', async ({
    completeHealthCheckFirstPage,
    termsAndConditionsPage,
    taskListPage,
    nhsLoginPages
  }) => {
    await test.step('Login not whitelisted user', async () => {
      await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
        mockedNotWhitelistedNhsNumber.code
      );
      expect(await completeHealthCheckFirstPage.getHeaderText()).toContain(
        'Get your NHS Health Check online'
      );
    });

    await test.step('Start and accept terms and conditions', async () => {
      await completeHealthCheckFirstPage.clickStartNowBtn();
      await termsAndConditionsPage.checkAcceptTermsBoxAndClickAcceptAndContinueButton();
      await taskListPage.waitUntilLoaded();
    });
  });
});
