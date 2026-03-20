import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { AddressModel } from "../../models/Address";

const randomAddress = AddressModel.getRandomAddress();

test.describe("Go To Clinic Page", () => {
  test(
    "Go To Clinic Page - accessibility scan",
    { tag: ["@accessibility"] },
    async ({
      homeTestStartPage,
      enterDeliveryAddressPage,
      selectDeliveryAddressPage,
      howComfortablePrickingFingerPage,
      goToClinicPage,
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
      await selectDeliveryAddressPage.selectAddressAndContinue();
      await howComfortablePrickingFingerPage.waitUntilPageLoaded();
      await howComfortablePrickingFingerPage.selectNoOptionAndContinue();
      await goToClinicPage.waitUntilPageLoaded();

      const accessErrors = await accessibility.runAccessibilityCheck(
        goToClinicPage.page,
        "Go To Clinic Page",
      );
      expect(accessErrors).toHaveLength(0);
    },
  );
});
