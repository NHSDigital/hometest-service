import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";

test.describe("Home Test Unavailable page", () => {
  test.use({
    errorCaptureOptions: {
      failOnNetworkError: false,
      failOnConsoleError: false,
    },
  });

  test(
    "Home Test Unavailable page - accessibility scan",
    { tag: ["@accessibility"] },
    async ({
      homeTestStartPage,
      enterDeliveryAddressPage,
      selectDeliveryAddressPage,
      kitNotAvailableInYourAreaPage,
      accessibility,
      loginUser,
      context,
      page,
    }) => {
      await loginUser(page);
      const unavailableAddress = {
        addressLine1: "BT GLOBAL SERVICES",
        addressLine2: "1 SOVEREIGN STREET",
        townCity: "LEEDS",
        postCode: "LS1 4BT",
      };

      await homeTestStartPage.navigate();
      await homeTestStartPage.clickStartNowButton();
      await enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue(unavailableAddress);
      await selectDeliveryAddressPage.waitUntilPageLoaded();
      await selectDeliveryAddressPage.selectAddressAndContinue();
      await kitNotAvailableInYourAreaPage.waitUntilPageLoaded();

      const accessErrors = await accessibility.runAccessibilityCheck(
        kitNotAvailableInYourAreaPage.page,
        "Kit Not Available In Your Area Page",
      );
      expect(accessErrors).toHaveLength(0);
    },
  );
});
