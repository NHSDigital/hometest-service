import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { AddressModel } from "../../models/Address";

const randomAddress = AddressModel.getRandomAddress();

test.describe("Home Test Unavailable page", () => {
  test(
    "Home Test Unavailable page - Kit not available in the area - By Postcode",
    {
      tag: ["@accessibility"],
    },
    async ({
      homeTestStartPage,
      findAddressPage,
      selectDeliveryAddressPage,
      kitNotAvailableInAreaPage,
      accessibility,
    }) => {
      randomAddress.postCode = "SW1A 1AA"; // A postcode where the kit is unavailable

      await homeTestStartPage.navigate();
      await homeTestStartPage.clickStartNowButton();
      await findAddressPage.fillPostCodeAndContinue(randomAddress);
      await selectDeliveryAddressPage.waitUntilPageLoad();
      await selectDeliveryAddressPage.selectAddressAndContinue();
      await kitNotAvailableInAreaPage.assertOnPage();
      await kitNotAvailableInAreaPage.waitUntilPageLoad();
      await kitNotAvailableInAreaPage.clickFindAnotherSexualHealthClinicAndOpenNewTab();
      await kitNotAvailableInAreaPage.assertFindAnotherSexualHealthClinicLinkContainsPostcode(
        randomAddress.postCode,
      );
      await homeTestStartPage.waitUntilPageLoad();

      const accessErrors = await accessibility.runAccessibilityCheck(
        kitNotAvailableInAreaPage.page,
        "Kit Not Available In Area Page",
      );
      expect(accessErrors).toHaveLength(0);
    },
  );

  test(
    "Home Test Unavailable page - Kit not available in the area - By Address",
    {
      tag: ["@accessibility"],
    },
    async ({
      homeTestStartPage,
      findAddressPage,
      selectDeliveryAddressPage,
      kitNotAvailableInAreaPage,
      accessibility,
    }) => {
      randomAddress.addressLine1 = "BT GLOBAL SERVICES";
      randomAddress.addressLine2 = "1 SOVEREIGN STREET";
      randomAddress.townCity = "LEEDS";
      randomAddress.postCode = "LS1 4BT"; // An address where the kit is unavailable

      await homeTestStartPage.navigate();
      await homeTestStartPage.clickStartNowButton();
      await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
      await selectDeliveryAddressPage.waitUntilPageLoad();
      await selectDeliveryAddressPage.selectAddressAndContinue();
      await kitNotAvailableInAreaPage.assertOnPage();
      await kitNotAvailableInAreaPage.waitUntilPageLoad();
      await kitNotAvailableInAreaPage.clickFindAnotherSexualHealthClinicAndOpenNewTab();
      await kitNotAvailableInAreaPage.assertFindAnotherSexualHealthClinicLinkContainsPostcode(
        randomAddress.postCode,
      );
      await homeTestStartPage.waitUntilPageLoad();

      const accessErrors = await accessibility.runAccessibilityCheck(
        kitNotAvailableInAreaPage.page,
        "Kit Not Available In Area Page",
      );
      expect(accessErrors).toHaveLength(0);
    },
  );
});
