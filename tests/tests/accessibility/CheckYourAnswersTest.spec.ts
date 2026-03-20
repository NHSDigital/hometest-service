import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { AddressModel } from "../../models/Address";

const randomAddress = AddressModel.getRandomAddress();

test(
  "Check your answers page",
  {
    tag: ["@accessibility"],
  },
  async ({
    homeTestStartPage,
    enterDeliveryAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage,
    checkYourAnswersPage,
    confirmMobileNumberPage,
    accessibility,
    context,
    loginUser,
    page
  }) => {
    await context.clearCookies();
    await context.clearPermissions();

    await loginUser(page);

    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    await enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await confirmMobileNumberPage.selectConfirmMobileNumberAndContinue();
    await checkYourAnswersPage.waitUntilPageLoaded();
    const accessErrors = await accessibility.runAccessibilityCheck(
      checkYourAnswersPage.page,
      "Check Your Answers Page",
    );
    expect(accessErrors).toHaveLength(0);
  },
);
