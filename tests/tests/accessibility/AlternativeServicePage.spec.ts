import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";

test.describe("Alternative Service Page", () => {
  test.use({
    errorCaptureOptions: {
      failOnNetworkError: false,
      failOnConsoleError: false,
    },
  });

  test(
    "Alternative Service Page - accessibility scan",
    { tag: ["@accessibility"] },
    async ({
      homeTestStartPage,
      enterDeliveryAddressPage,
      selectDeliveryAddressPage,
      howComfortablePrickingFingerPage,
      goToClinicPage,
      accessibility,
    }) => {
      const unavailableAddress = {
        addressLine1: "2 HOLMHURST ST. MARY",
        addressLine2: "THE RIDGE, ST",
        townCity: "LEONARDS-ON-SEA",
        postCode: "TN37 7PT",
      };

      await homeTestStartPage.navigate();
      await homeTestStartPage.clickStartNowButton();
      await enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue(unavailableAddress);
      await selectDeliveryAddressPage.waitUntilPageLoad();
      await selectDeliveryAddressPage.selectAddressAndContinue();
      await howComfortablePrickingFingerPage.waitUntilPageLoad();
      await howComfortablePrickingFingerPage.selectNoOptionAndContinue();
      await goToClinicPage.waitUntilPageLoad();

      const accessErrors = await accessibility.runAccessibilityCheck(
        goToClinicPage.page,
        "Alternative Service Page",
      );
      expect(accessErrors).toHaveLength(0);
    },
  );
});
