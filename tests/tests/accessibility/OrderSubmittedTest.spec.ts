import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { AddressModel } from "../../models/Address";
import { TestOrderDbClient } from "../../db/TestOrderDbClient";
import { NHSLoginMockedUser } from "../../utils/users/BaseUser";

const randomAddress = AddressModel.getRandomAddress();
const dbClient = new TestOrderDbClient();
let loggedInUser: NHSLoginMockedUser;

test.describe("Accessibility Testing @accessibility", () => {
  test.beforeEach(async ({ loginUser,page }) => {
    await dbClient.connect();
    const user = await loginUser(page);
    loggedInUser = user;
  });

  test.afterEach(async () => {
    const patientId = await dbClient.getPatientUidByNhsNumber(loggedInUser.nhsNumber!);
    if (patientId) {
      await dbClient.deleteConsentByPatientUid(patientId);
      await dbClient.deleteOrderStatusByPatientUid(patientId);
      await dbClient.deleteOrderByPatientUid(patientId);
    }
    await dbClient.deletePatientMapping(loggedInUser.nhsNumber!, loggedInUser.dob!);
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
      await orderSubmittedPage.waitUntilPageLoaded();
      const accessErrors = await accessibility.runAccessibilityCheck(
        orderSubmittedPage.page,
        "Order Submitted Page",
      );
      expect(accessErrors).toHaveLength(0);
    },
  );
});
