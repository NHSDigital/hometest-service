import { test } from "../../fixtures/CombinedTestFixture";
import { expect } from "@playwright/test";
import { AddressModel } from "../../models/Address";

const randomAddress = AddressModel.getRandomAddress();

test.describe("Home test E2E tests", () => {
  test(
    "E2E - Full HIV Test user journey",
    { tag: ["@ui", "@e2e"] },
    async ({
      homeTestStartPage,
      findAddressPage,
      selectDeliveryAddressPage,
      howComfortablePrickingFingerPage,
      confirmAndUpdateMobileNumberPage,
      checkYourAnswersPage,
      orderSubmittedPage,
    }) => {
      await homeTestStartPage.navigate();
      await expect(homeTestStartPage.headerText).toHaveText("Get a self-test kit for HIV");
      await homeTestStartPage.clickStartNowButton();

      await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
      await selectDeliveryAddressPage.clickEditAddressLink();
      await selectDeliveryAddressPage.clickContinueButton();

      await selectDeliveryAddressPage.selectAddressAndContinue();
      await expect(homeTestStartPage.headerText).toHaveText(
        "This is what you'll need to do to give a blood sample",
      );

      await howComfortablePrickingFingerPage.selectYesOptionAndContinue();

      await confirmAndUpdateMobileNumberPage.selectConfirmMobileNumber();
      await confirmAndUpdateMobileNumberPage.clickContinue();

      await checkYourAnswersPage.selectConsentCheckbox();
      await checkYourAnswersPage.clickSubmitOrder();
      await expect(orderSubmittedPage.headerText).toHaveText("Order submitted");
    },
  );
});
