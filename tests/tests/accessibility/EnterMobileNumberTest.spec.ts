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
    enterDeliveryAddressPage,
    selectDeliveryAddressPage,
    accessibility,
    enterMobileNumberPage,
    howComfortablePrickingFingerPage,
  }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    await enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await enterMobileNumberPage.waitUntilPageLoad();
    const postInputAccessErrors = await accessibility.runAccessibilityCheck(
      enterMobileNumberPage.page,
      "Enter Mobile Number Page",
    );
    expect(postInputAccessErrors).toHaveLength(0);
  },
);
