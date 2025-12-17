import { test, expect } from '../../fixtures/commonFixture';
import { verifyErrorPageTitle } from '../../lib/PageTitleHelper';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

test.beforeEach(async ({ testedUser, dynamoDBServiceUtils }) => {
  await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
    testedUser,
    HealthCheckFactory.createHealthCheck(
      testedUser,
      HealthCheckType.QUESTIONNAIRE_COMPLETED
    )
  );
});

test(
  'Blood test order error messages',
  {
    tag: ['@ui', '@bloodTests', '@regression', '@negative']
  },
  async ({ taskListPage, bloodTestPages }) => {
    await taskListPage.goToTaskListPageAndWaitForLoading();
    await taskListPage.clickOrderABloodTestKitLink();
    await bloodTestPages.orderBloodTestKitPage.waitUntilLoaded();
    await bloodTestPages.orderBloodTestKitPage.clickContinueButton();
    await bloodTestPages.findDeliveryAddressPage.waitUntilLoaded();

    await test.step('Check empty fields error messages on FindYourAddress page', async () => {
      await bloodTestPages.findDeliveryAddressPage.clickContinueButton();

      await expect(
        bloodTestPages.findDeliveryAddressPage.postcodeErrorLink
      ).toBeVisible();
      expect(
        await bloodTestPages.findDeliveryAddressPage.getPostcodeErrorMessageText()
      ).toEqual('Error: Enter postcode');
      await verifyErrorPageTitle(bloodTestPages.findDeliveryAddressPage);
    });

    await test.step('Check empty fields error messages on EnterYourAddress page', async () => {
      await bloodTestPages.findDeliveryAddressPage.clickEnterAddressManuallyLink();
      await bloodTestPages.enterDeliveryAddressPage.waitUntilLoaded();
      await bloodTestPages.enterDeliveryAddressPage.clickContinueButton();

      await expect(
        bloodTestPages.enterDeliveryAddressPage.addressLine1ErrorLink
      ).toBeVisible();
      await expect(
        bloodTestPages.enterDeliveryAddressPage.townCityErrorLink
      ).toBeVisible();
      await expect(
        bloodTestPages.enterDeliveryAddressPage.postcodeErrorLink
      ).toBeVisible();
      expect(
        await bloodTestPages.enterDeliveryAddressPage.getAddressLine1ErrorMessageText()
      ).toEqual(
        'Error: Enter address line 1, typically the building and street'
      );
      expect(
        await bloodTestPages.enterDeliveryAddressPage.getTownCityErrorMessageText()
      ).toEqual('Error: Enter town or city');
      expect(
        await bloodTestPages.enterDeliveryAddressPage.getPostcodeErrorMessageText()
      ).toEqual('Error: Enter postcode');
      await verifyErrorPageTitle(bloodTestPages.enterDeliveryAddressPage);
    });
  }
);
