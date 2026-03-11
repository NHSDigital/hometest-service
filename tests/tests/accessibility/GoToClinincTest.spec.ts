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
    }) => {
      await homeTestStartPage.navigate();
      await homeTestStartPage.clickStartNowButton();
      await enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
      await selectDeliveryAddressPage.waitUntilPageLoad();
      await selectDeliveryAddressPage.selectAddressAndContinue();
      await howComfortablePrickingFingerPage.waitUntilPageLoad();
      await howComfortablePrickingFingerPage.selectNoOptionAndContinue();
      await goToClinicPage.waitUntilPageLoad();

      const accessErrors = await accessibility.runAccessibilityCheck(
        goToClinicPage.page,
        "Go To Clinic Page",
      );
      expect(accessErrors).toHaveLength(0);
    },
  );
});
