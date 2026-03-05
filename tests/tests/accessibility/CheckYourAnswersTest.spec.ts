import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { AddressModel } from "../../models/Address";

const randomAddress = AddressModel.getRandomAddress();

test(
  "Check Your Answers Page",
  {
    tag: ["@accessibility"],
  },
  async ({
    homeTestStartPage,
    findAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage,
    checkYourAnswersPage,
    confirmAndUpdateMobileNumberPage,
    accessibility,
  }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await confirmAndUpdateMobileNumberPage.selectConfirmMobileNumber();
    await confirmAndUpdateMobileNumberPage.clickContinue();
    await checkYourAnswersPage.selectConsentCheckbox();
    await checkYourAnswersPage.waitUntilPageLoad();
    const accessErrors = await accessibility.runAccessibilityCheck(
      checkYourAnswersPage.page,
      "Check Your Answers Page",
    );
    expect(accessErrors).toHaveLength(0);
  },
);
