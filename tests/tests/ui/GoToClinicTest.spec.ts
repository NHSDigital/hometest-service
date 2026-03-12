import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { AddressModel } from "../../models/Address";

const randomAddress = AddressModel.getRandomAddress();

test.describe(
  "Go To Clinic Page - User selects 'No' to 'How comfortable are you pricking your finger?' question, and is directed to Go To Clinic Page",
  {
    tag: ["@ui"],
  },
  () => {
    test("should display nearest clinic details", async ({
      homeTestStartPage,
      enterDeliveryAddressPage,
      selectDeliveryAddressPage,
      howComfortablePrickingFingerPage,
      goToClinicPage,
    }) => {
      await homeTestStartPage.navigate();
      await homeTestStartPage.clickStartNowButton();
      await enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
      await selectDeliveryAddressPage.waitUntilPageLoad();
      await selectDeliveryAddressPage.selectAddressAndContinue();

      if (!goToClinicPage.page.url().includes("/get-self-test-kit-for-HIV/go-to-clinic")) {
        await howComfortablePrickingFingerPage.waitUntilPageLoad();
        await howComfortablePrickingFingerPage.selectNoOptionAndContinue();
      }

      await goToClinicPage.waitUntilPageLoad();

      await expect(
        goToClinicPage.page.getByText(
          "To get tested for HIV, go to your nearest sexual health clinic, which is:",
        ),
      ).toBeVisible();
    });
  },
);
