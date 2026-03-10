import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { AddressModel } from "../../models/Address";

const randomAddress = AddressModel.getRandomAddress();

test(
  "How comfortable pricking finger Page",
  {
    tag: ["@accessibility"],
  },
  async ({
    homeTestStartPage,
    enterDeliveryAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage,
    accessibility,
  }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    await enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.waitUntilPageLoad();
    const accessErrors = await accessibility.runAccessibilityCheck(
      howComfortablePrickingFingerPage.page,
      "How Comfortable Pricking Finger Page",
    );
    expect(accessErrors).toHaveLength(0);
  },
);
