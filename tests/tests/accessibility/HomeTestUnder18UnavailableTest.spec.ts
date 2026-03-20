import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { AddressModel } from "../../models/Address";
import type { NHSLoginMockedUser } from "../../utils/users/BaseUser";
import { SpecialUserKey } from "../../utils/users/SpecialUserKey";
import { createWireMockUserInfoMapping } from "../../utils/users/wiremockUserInfoMapping";

const randomAddress = AddressModel.getRandomAddress();

test.describe("Home Test Under 18 Unavailable page", () => {
  let userInfoMappingId: string | undefined;

  test.use({
    errorCaptureOptions: {
      failOnNetworkError: false,
      failOnConsoleError: false,
    },
  });

  test.beforeEach(async ({ config, homeTestStartPage, loginUser,  page, context }) => {
    await context.clearCookies();
    await context.clearPermissions();
    await loginUser(page, SpecialUserKey.UNDER_18);

    // const user = userManager.getSpecialUser(SpecialUserKey.UNDER_18) as NHSLoginMockedUser;

    // if (config.useWiremockAuth) {
    //   userInfoMappingId = await wiremock.createMapping(createWireMockUserInfoMapping(user));
    // }

    // await userManager.login(user, page);

   // await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
  });

  test.afterEach(async ({ config, wiremock }) => {
    if (config.useWiremockAuth && userInfoMappingId) {
      await wiremock.deleteMapping(userInfoMappingId);
      userInfoMappingId = undefined;
    }
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
