import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";

test(
  "Enter delivery address page",
  {
    tag: ["@accessibility"],
  },
  async ({ homeTestStartPage, enterDeliveryAddressPage, accessibility, loginUser, context, page }) => {
    await context.clearCookies();
    await context.clearPermissions();
    await loginUser(page);
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    await enterDeliveryAddressPage.waitUntilPageLoaded();
    const accessErrors = await accessibility.runAccessibilityCheck(
      enterDeliveryAddressPage.page,
      "Enter Delivery Address Page",
    );
    expect(accessErrors).toHaveLength(0);
  },
);
