import { expect } from "@playwright/test";

import { test } from "../../fixtures/CombinedTestFixture";
import { AddressModel } from "../../models/Address";
import { type NHSLoginMockedUser, SpecialUserKey } from "../../utils/users";

const randomAddress = AddressModel.getRandomAddress();

test.describe("HIV Test Order journeys - User under 18", () => {
  test.use({
    errorCaptureOptions: {
      failOnNetworkError: false,
      failOnConsoleError: false,
    },
  });

  test.beforeEach(
    async ({ beforeYouStartPage, getSelfTestKitPage, userManager, page, context }) => {
      await context.clearCookies();
      await context.clearPermissions();

      const user = userManager.getSpecialUser(SpecialUserKey.UNDER_18) as NHSLoginMockedUser;

      await userManager.login(user, page);
      await beforeYouStartPage.navigate();
      await beforeYouStartPage.clickContinueToOrderKitButton();
      await expect(getSelfTestKitPage.headerText).toHaveText("Order a free HIV self-test kit");
      await getSelfTestKitPage.clickStartNowButton();
    },
  );

  test("Order test journey with address search", async ({
    enterDeliveryAddressPage,
    selectDeliveryAddressPage,
    cannotUseServiceUnder18Page,
  }) => {
    await enterDeliveryAddressPage.fillPostCodeAndContinue(randomAddress);
    await selectDeliveryAddressPage.clickContinueButton();
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await cannotUseServiceUnder18Page.waitUntilPageLoaded();
    await expect(cannotUseServiceUnder18Page.pageHeader).toHaveText(
      "You cannot use this service as you are under 18",
    );
    await cannotUseServiceUnder18Page.expectPostcodeInFindAnotherClinicLink(randomAddress.postCode);
  });

  test("Order test journey with manual address", async ({
    enterDeliveryAddressPage,
    enterAddressManuallyPage,
    cannotUseServiceUnder18Page,
  }) => {
    await enterDeliveryAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.fillDeliveryAddressFields(randomAddress);
    await enterAddressManuallyPage.clickContinue();
    await cannotUseServiceUnder18Page.waitUntilPageLoaded();
    await expect(cannotUseServiceUnder18Page.pageHeader).toHaveText(
      "You cannot use this service as you are under 18",
    );
    await cannotUseServiceUnder18Page.expectPostcodeInFindAnotherClinicLink(randomAddress.postCode);
  });
});
