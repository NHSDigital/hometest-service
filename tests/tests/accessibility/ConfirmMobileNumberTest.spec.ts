import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { AddressModel } from "../../models/Address";

const randomAddress = AddressModel.getRandomAddress();

test(
  "Confirm mobile number page",
  {
    tag: ["@accessibility"],
  },
  async ({
    homeTestStartPage,
    enterDeliveryAddressPage,
    selectDeliveryAddressPage,
    accessibility,
    confirmMobileNumberPage,
    howComfortablePrickingFingerPage,
    loginUser,
    context,
    page,
  }) => {

    await loginUser(page);
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    await enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await confirmMobileNumberPage.selectUseAnotherMobileNumberOption();
    const accessErrors = await accessibility.runAccessibilityCheck(
      confirmMobileNumberPage.page,
      "Confirm mobile number page",
    );
    expect(accessErrors).toHaveLength(0);
  },
);
