import { test } from "../../fixtures/CombinedTestFixture";
import { expect } from "@playwright/test";
import { AddressModel } from "../../models/Address";
import { SpecialUserKey } from "../../utils/users/SpecialUserKey";

const randomAddress = AddressModel.getRandomAddress();

test.describe("HIV Test Order journeys - User under 18", () => {
  test.beforeEach(async ({ homeTestStartPage, userManager, page, context }) => {
    // Clear the existing storage state to perform a fresh login
    await context.clearCookies();
    await context.clearPermissions();

    const user = userManager.getSpecialUser(SpecialUserKey.UNDER_18);
    await userManager.login(user, page);
    await homeTestStartPage.navigate();
    await expect(homeTestStartPage.headerText).toHaveText(
      "Get a self-test kit for HIV",
    );
    await homeTestStartPage.clickStartNowButton();
  });

  test("Order test journey", async ({
    findAddressPage,
    selectDeliveryAddressPage,
  }) => {
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.clickEditAddressLink();
    const { postCode, firstLineAddress } =
      await findAddressPage.getPostcodeAndAddressValues();
    expect(postCode).toBe(randomAddress.postCode);
    expect(firstLineAddress).toBe(randomAddress.addressLine1);
    await selectDeliveryAddressPage.clickContinueButton();
    await selectDeliveryAddressPage.selectAddressAndContinue();

  });
});
