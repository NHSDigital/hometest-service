import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { AddressModel } from "../../models/Address";
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

    const user = userManager.getSpecialUser(SpecialUserKey.UNDER_18);
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
      await selectDeliveryAddressPage.waitUntilPageLoad();
      await selectDeliveryAddressPage.clickContinueButton();
      await selectDeliveryAddressPage.selectAddressAndContinue();
      await cannotUseServiceUnder18Page.waitUntilPageLoad();

      const accessErrors = await accessibility.runAccessibilityCheck(
        cannotUseServiceUnder18Page.page,
        "Cannot Use Service Under 18 Page",
      );
      expect(accessErrors).toHaveLength(0);
    },
  );

  test(
    "Home Test Under 18 Unavailable page (manual address) - accessibility scan",
    { tag: ["@accessibility"] },
    async ({
      enterDeliveryAddressPage,
      enterAddressManuallyPage,
      cannotUseServiceUnder18Page,
      accessibility,
    }) => {
      await enterDeliveryAddressPage.clickEnterAddressManuallyLink();
      await enterAddressManuallyPage.fillDeliveryAddressFields(randomAddress);
      await enterAddressManuallyPage.clickContinue();
      await cannotUseServiceUnder18Page.waitUntilPageLoad();

      const accessErrors = await accessibility.runAccessibilityCheck(
        cannotUseServiceUnder18Page.page,
        "Cannot Use Service Under 18 Page - Manual Address",
      );
      expect(accessErrors).toHaveLength(0);
    },
  );
});
