import { test } from "../../fixtures/CombinedTestFixture";
import { expect } from "@playwright/test";
import { AddressModel } from "../../models/Address";
import { TestOrderDbClient } from "../../db/TestOrderDbClient";

const randomAddress = AddressModel.getRandomAddress();
let orderId = "";
const dbClient = new TestOrderDbClient();

test.describe("Home test E2E tests", () => {
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
    "E2E - Full HIV Test user journey",
    { tag: ["@ui", "@e2e"] },
    async ({
      homeTestStartPage,
      enterDeliveryAddressPage,
      selectDeliveryAddressPage,
      howComfortablePrickingFingerPage,
      confirmMobileNumberPage,
      checkYourAnswersPage,
      orderSubmittedPage,
    }) => {
      await homeTestStartPage.navigate();
      await expect(homeTestStartPage.headerText).toHaveText("Get a self-test kit for HIV");
      await homeTestStartPage.clickStartNowButton();
      await enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
      await selectDeliveryAddressPage.selectAddressAndContinue();
      await expect(homeTestStartPage.headerText).toHaveText(
        "This is what you'll need to do to give a blood sample",
      );
      await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
      await confirmMobileNumberPage.selectConfirmMobileNumberAndContinue();
      await checkYourAnswersPage.checkConsentCheckbox();
      await checkYourAnswersPage.clickSubmitOrder();
      await expect(orderSubmittedPage.headerText).toHaveText("Order submitted");
    },
  );
});
