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

      await expect(
        kitNotAvailableInYourAreaPage.page.getByRole("heading", {
          level: 1,
          name: /Free HIV self-test kits are not available in your area using this service/i,
        }),
      ).toBeVisible();

      const accessErrors = await accessibility.runAccessibilityCheck(
        kitNotAvailableInYourAreaPage.page,
        "Kit Not Available In Your Area Page",
      );
      expect(accessErrors).toHaveLength(0);
    },
  );
});
