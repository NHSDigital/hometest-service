import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";

test(
  "Enter address manually page",
  {
    tag: ["@accessibility"],
  },
  async ({
    homeTestStartPage,
    enterDeliveryAddressPage,
    enterAddressManuallyPage,
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
    await enterDeliveryAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.waitUntilPageLoaded();
    const accessErrors = await accessibility.runAccessibilityCheck(
      enterAddressManuallyPage.page,
      "Enter Address Manually Page",
    );
    expect(accessErrors).toHaveLength(0);
  },
);
