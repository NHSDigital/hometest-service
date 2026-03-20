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
    enterDeliveryAddressPage,
    selectDeliveryAddressPage,
    accessibility,
    loginUser,
    context,
    page,
  }) => {
    await context.clearCookies();
    await context.clearPermissions();
    await loginUser(page);
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    await enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.waitUntilPageLoaded();
    const accessErrors = await accessibility.runAccessibilityCheck(
      selectDeliveryAddressPage.page,
      "Select Delivery Address Page",
    );
    expect(accessErrors).toHaveLength(0);
  },
);
