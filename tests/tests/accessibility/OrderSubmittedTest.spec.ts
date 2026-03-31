import { expect } from "@playwright/test";

import { test } from "../../fixtures/CombinedTestFixture";
import { AddressModel } from "../../models/Address";

const randomAddress = AddressModel.getRandomAddress();

test.describe("Accessibility Testing @accessibility", () => {
  test.afterAll(async ({ testedUser, testOrderDb }) => {
    const patientId = await testOrderDb.getPatientUidByNhsNumber(testedUser.nhsNumber!);
    if (patientId) {
      await testOrderDb.deleteConsentByPatientUid(patientId);
      await testOrderDb.deleteOrderStatusByPatientUid(patientId);
      await testOrderDb.deleteOrderByPatientUid(patientId);
    }
    await testOrderDb.deletePatientMapping(testedUser.nhsNumber!, testedUser.dob!);
  });

  test(
    "Order Submitted page",
    {
      tag: ["@accessibility"],
    },
    async ({
      homeTestStartPage,
      enterDeliveryAddressPage,
      selectDeliveryAddressPage,
      howComfortablePrickingFingerPage,
      confirmMobileNumberPage,
      checkYourAnswersPage,
      orderSubmittedPage,
      accessibility,
    }) => {
      await homeTestStartPage.navigate();
      await homeTestStartPage.clickStartNowButton();
      await enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
      await selectDeliveryAddressPage.selectAddressAndContinue();
      await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
      await confirmMobileNumberPage.selectConfirmMobileNumberAndContinue();
      await checkYourAnswersPage.checkConsentCheckbox();
      await checkYourAnswersPage.clickSubmitOrder();
      await orderSubmittedPage.waitUntilPageLoaded();
      const accessErrors = await accessibility.runAccessibilityCheck(
        orderSubmittedPage.page,
        "Order Submitted Page",
      );
      expect(accessErrors).toHaveLength(0);
    },
  );
});
