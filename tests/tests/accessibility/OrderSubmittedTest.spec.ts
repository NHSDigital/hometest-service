import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { AddressModel } from "../../models/Address";

const randomAddress = AddressModel.getRandomAddress();

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
