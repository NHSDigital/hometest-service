import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { AddressModel } from "../../models/Address";
import type { NHSLoginMockedUser } from "../../utils/users/BaseUser";
import { SpecialUserKey } from "../../utils/users/SpecialUserKey";

const randomAddress = AddressModel.getRandomAddress();

test.describe("Home Test Under 18 Unavailable page", () => {
  test.use({
    errorCaptureOptions: {
      failOnNetworkError: false,
      failOnConsoleError: false,
    },
  });

  test.beforeEach(async ({ homeTestStartPage, userManager, page, context }) => {
    await context.clearCookies();
    await context.clearPermissions();

    const user = userManager.getSpecialUser(SpecialUserKey.UNDER_18) as NHSLoginMockedUser;

    await userManager.login(user, page);

    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
  });

  test(
    "Home Test Under 18 Unavailable page - accessibility scan",
    { tag: ["@accessibility"] },
    async ({
      enterDeliveryAddressPage,
      selectDeliveryAddressPage,
      cannotUseServiceUnder18Page,
      accessibility,
    }) => {
      await enterDeliveryAddressPage.fillPostCodeAndContinue(randomAddress);
      await selectDeliveryAddressPage.waitUntilPageLoaded();
      await selectDeliveryAddressPage.selectAddressAndContinue();
      await cannotUseServiceUnder18Page.waitUntilPageLoaded();

      const accessErrors = await accessibility.runAccessibilityCheck(
        cannotUseServiceUnder18Page.page,
        "Cannot Use Service Under 18 Page",
      );
      expect(accessErrors).toHaveLength(0);
    },
  );
});
