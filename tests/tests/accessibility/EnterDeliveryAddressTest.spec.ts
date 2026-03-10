import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";

test(
  "Enter delivery address page",
  {
    tag: ["@accessibility"],
  },
  async ({ homeTestStartPage, enterDeliveryAddressPage, accessibility }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    await enterDeliveryAddressPage.waitUntilPageLoad();
    const accessErrors = await accessibility.runAccessibilityCheck(
      enterDeliveryAddressPage.page,
      "Enter Delivery Address Page",
    );
    expect(accessErrors).toHaveLength(0);
  },
);
