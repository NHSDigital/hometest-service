import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { AddressModel } from "../../models/Address";

const randomAddress = AddressModel.getRandomAddress();

test(
  "Enter mobile number page",
  {
    tag: ["@accessibility"],
  },
  async ({
    homeTestStartPage,
    findAddressPage,
    selectDeliveryAddressPage,
    accessibility,
    enterMobileNumberPage,
    howComfortablePrickingFingerPage,
  }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.waitUntilPageLoad();
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.waitUntilPageLoad();
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await enterMobileNumberPage.waitUntilPageLoad();
    await enterMobileNumberPage.clickUseAnotherNumber();
    const postInputAccessErrors = await accessibility.runAccessibilityCheck(
      enterMobileNumberPage.page,
      "Enter Mobile Number Page - After Input",
    );
    expect(postInputAccessErrors).toHaveLength(0);
  },
);
