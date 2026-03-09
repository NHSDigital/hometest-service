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
      findAddressPage,
      selectDeliveryAddressPage,
      kitNotAvailableInYourAreaPage,
      accessibility,
    }) => {
      const unavailableAddress = {
        addressLine1: "BT GLOBAL SERVICES",
        addressLine2: "1 SOVEREIGN STREET",
        townCity: "LEEDS",
        postCode: "LS1 4BT",
      };

      await homeTestStartPage.navigate();
      await homeTestStartPage.clickStartNowButton();
      await findAddressPage.fillPostCodeAndAddressAndContinue(unavailableAddress);
      await selectDeliveryAddressPage.waitUntilPageLoad();
      await selectDeliveryAddressPage.selectAddressAndContinue();
      await kitNotAvailableInYourAreaPage.waitUntilPageLoad();

      const accessErrors = await accessibility.runAccessibilityCheck(
        kitNotAvailableInYourAreaPage.page,
        "Kit Not Available In Your Area Page",
      );
      expect(accessErrors).toHaveLength(0);
    },
  );
});
