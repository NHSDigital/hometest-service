import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { AddressModel } from "../../models/Address";
import { TestOrderDbClient } from "../../db/TestOrderDbClient";

const randomAddress = AddressModel.getRandomAddress();
let orderId = "";
const dbClient = new TestOrderDbClient();

test.describe("Accessibility Testing @accessibility", () => {
  test.beforeEach(async () => {
    orderId = "";
    await dbClient.connect();
  });

  test.afterEach(async ({ testedUser }) => {
    if (orderId) {
      const order = await dbClient.getOrderByUid(orderId);
      const patientId = order?.patient_uid;
      if (patientId) {
        await dbClient.deleteConsentByPatientUid(patientId);
        await dbClient.deleteOrderByPatientUid(patientId);
      }
      await dbClient.deletePatientMapping(testedUser.nhsNumber!, testedUser.dob!);
    }
    await dbClient.disconnect();
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
      await orderSubmittedPage.waitUntilPageLoad();
      const accessErrors = await accessibility.runAccessibilityCheck(
        orderSubmittedPage.page,
        "Order Submitted Page",
      );
      expect(accessErrors).toHaveLength(0);
    },
  );
});
