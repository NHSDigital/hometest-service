import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { AddressModel } from "../../models/Address";
import { SpecialUserKey } from "../../utils/users/SpecialUserKey";

const randomAddress = AddressModel.getRandomAddress();

test.describe("Home Test Under 18 Unavailable page", () => {
  let userInfoMappingId: string | undefined;

  test.use({
    errorCaptureOptions: {
      failOnNetworkError: false,
      failOnConsoleError: false,
    },
  });

  test.beforeEach(async ({ homeTestStartPage, loginUser, page, context }) => {

    const { mappingId } = await loginUser(page, SpecialUserKey.UNDER_18);
    userInfoMappingId = mappingId;
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
