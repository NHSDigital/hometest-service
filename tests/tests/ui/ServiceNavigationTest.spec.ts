import { test } from "../../fixtures/CombinedTestFixture";
import { expect } from "@playwright/test";
import { PersonalDetailsModel } from "../../models/PersonalDetails";
import { AddressModel } from "../../models/Address";

const randomAddress = AddressModel.getRandomAddress();
const personalDetails = PersonalDetailsModel.getRandomPersonalDetails();

test.describe("Reaching Check Your Answers page", { tag: "@ui" }, () => {
  test.beforeEach(async ({
    beforeYouStartPage,
    getSelfTestKitPage
  }) => {
    await beforeYouStartPage.navigate();
    await beforeYouStartPage.clickContinueToOrderKitButton();
    await expect(getSelfTestKitPage.headerText).toHaveText("Get a self-test kit for HIV");
    await getSelfTestKitPage.clickStartNowButton();
  });

  test("Via postcode entry and confirming the default phone number", async ({
    enterDeliveryAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage,
    confirmMobileNumberPage,
    checkYourAnswersPage,
  }) => {
    await enterDeliveryAddressPage.fillPostCodeAndContinue(randomAddress);
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await confirmMobileNumberPage.selectConfirmMobileNumberAndContinue();
    await expect(checkYourAnswersPage.submitOrderButton).toBeVisible();
  });

  test("Via postcode entry and adding a new phone number", async ({
    enterDeliveryAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage,
    confirmMobileNumberPage,
    checkYourAnswersPage,
  }) => {
    await enterDeliveryAddressPage.fillPostCodeAndContinue(randomAddress);
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await confirmMobileNumberPage.fillAlternativeMobileNumberAndContinue(personalDetails);
    await expect(checkYourAnswersPage.submitOrderButton).toBeVisible();
  });

  test("Via manual address entry and confirming the default phone number", async ({
    enterDeliveryAddressPage,
    enterAddressManuallyPage,
    howComfortablePrickingFingerPage,
    confirmMobileNumberPage,
    checkYourAnswersPage,
  }) => {
    await enterDeliveryAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.fillDeliveryAddressFields(randomAddress);
    await enterAddressManuallyPage.clickContinue();
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await confirmMobileNumberPage.selectConfirmMobileNumberAndContinue();
    await expect(checkYourAnswersPage.submitOrderButton).toBeVisible();
  });

  test("Via manual address entry and adding a new phone number", async ({
    enterDeliveryAddressPage,
    enterAddressManuallyPage,
    howComfortablePrickingFingerPage,
    confirmMobileNumberPage,
    checkYourAnswersPage,
  }) => {
    await enterDeliveryAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.fillDeliveryAddressFields(randomAddress);
    await enterAddressManuallyPage.clickContinue();
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await confirmMobileNumberPage.fillAlternativeMobileNumberAndContinue(personalDetails);
    await expect(checkYourAnswersPage.submitOrderButton).toBeVisible();
  });
});
