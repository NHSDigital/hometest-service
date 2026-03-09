import { test } from "../../fixtures/CombinedTestFixture";
import { expect } from "@playwright/test";
import { AddressModel } from "../../models/Address";
import { SpecialUserKey } from "../../utils/users/SpecialUserKey";

const randomAddress = AddressModel.getRandomAddress();

test.describe("HIV Test Order journeys - User under 18", () => {
  test.use({
    errorCaptureOptions: {
      failOnNetworkError: false,
      failOnConsoleError: false,
    },
  });

  test.beforeEach(async ({ homeTestStartPage, userManager, page, context }) => {
    await context.clearCookies();
    await context.clearPermissions();

    const user = userManager.getSpecialUser(SpecialUserKey.UNDER_18);
    await userManager.login(user, page);
    await homeTestStartPage.navigate();
    await expect(homeTestStartPage.headerText).toHaveText("Get a self-test kit for HIV");
    await homeTestStartPage.clickStartNowButton();
  });

  test("Order test journey with address search", async ({
    findAddressPage,
    selectDeliveryAddressPage,
    cannotUseServiceUnder18Page,
  }) => {
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.clickEditAddressLink();

    await selectDeliveryAddressPage.clickContinueButton();
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await expect(cannotUseServiceUnder18Page.headerText).toHaveText(
      "You cannot use this service as you are under 18",
    );
  });

  test("Order test journey with manual address", async ({
    findAddressPage,
    enterAddressManuallyPage,
    cannotUseServiceUnder18Page,
  }) => {
    await findAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.fillAddressAndContinue(randomAddress);
    await expect(cannotUseServiceUnder18Page.headerText).toHaveText(
      "You cannot use this service as you are under 18",
    );
  });
});
