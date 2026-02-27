import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { AddressModel } from "../../models/Address";

const randomAddress = AddressModel.getRandomAddress();

test(
  "Select delivery address page",
  {
    tag: ["@accessibility"],
  },
  async ({
    homeTestStartPage,
    findAddressPage,
    selectDeliveryAddressPage,
    accessibility,
  }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.waitUntilPageLoad();
    const accessErrors = await accessibility.runAccessibilityCheck(
      selectDeliveryAddressPage.page,
      "Select Delivery Address Page",
    );
    expect(accessErrors).toHaveLength(0);
  },
);
