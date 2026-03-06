import { test } from "../../fixtures/CombinedTestFixture";
import { expect } from "@playwright/test";
import { AddressModel } from "../../models/Address";
import { PersonalDetailsModel } from "../../models/PersonalDetails";

const randomAddress = AddressModel.getRandomAddress();
const personalDetails = PersonalDetailsModel.getRandomPersonalDetails();

test.describe("Reaching Check Your Answers page", { tag: "@ui" }, () => {
  test.beforeEach(async ({ homeTestStartPage }) => {
    await homeTestStartPage.navigate();
    await expect(homeTestStartPage.headerText).toHaveText("Get a self-test kit for HIV");
    await homeTestStartPage.clickStartNowButton();
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

test.describe("Editing during the order flow", { tag: "@ui" }, () => {
  test.beforeEach(async ({ homeTestStartPage }) => {
    await homeTestStartPage.navigate();
    await expect(homeTestStartPage.headerText).toHaveText("Get a self-test kit for HIV");
    await homeTestStartPage.clickStartNowButton();
  });

  test("Updated address reflected after editing postcode during the flow", async ({
    enterDeliveryAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage,
    confirmMobileNumberPage,
    checkYourAnswersPage,
  }) => {
    await enterDeliveryAddressPage.fillPostCodeAndContinue(randomAddress);
    await selectDeliveryAddressPage.clickEditPostcodeLink();
    await enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await confirmMobileNumberPage.selectConfirmMobileNumberAndContinue();
    const address = await checkYourAnswersPage.getAddressValue();
    expect(address?.trim()).not.toBe("");
  });

  test("Updated mobile number reflected after changing it during the flow", async ({
    enterDeliveryAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage,
    confirmMobileNumberPage,
    checkYourAnswersPage,
  }) => {
    await enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await confirmMobileNumberPage.fillAlternativeMobileNumberAndContinue(personalDetails);
    const mobileNumber = await checkYourAnswersPage.getMobileNumberValue();
    expect(mobileNumber?.replace(/[^\d+]/g, "")).toBe(
      personalDetails.mobileNumber.replace(/[^\d+]/g, ""),
    );
  });
});

test.describe("Check your answers page - Change fields", { tag: "@ui" }, () => {
  test.beforeEach(
    async ({
      homeTestStartPage,
      enterDeliveryAddressPage,
      selectDeliveryAddressPage,
      howComfortablePrickingFingerPage,
      confirmMobileNumberPage,
      checkYourAnswersPage,
    }) => {
      await homeTestStartPage.navigate();
      await expect(homeTestStartPage.headerText).toHaveText("Get a self-test kit for HIV");
      await homeTestStartPage.clickStartNowButton();
      await enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
      await selectDeliveryAddressPage.selectAddressAndContinue();
      await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
      await confirmMobileNumberPage.selectConfirmMobileNumberAndContinue();
      await checkYourAnswersPage.checkConsentCheckbox();
    },
  );

  test("Update delivery address and mobile number and assert correct values", async ({
    checkYourAnswersPage,
    enterDeliveryAddressPage,
    enterAddressManuallyPage,
    confirmMobileNumberPage,
  }) => {
    await checkYourAnswersPage.clickDeliveryAddressChangeLink();
    await enterDeliveryAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.fillDeliveryAddressFields(randomAddress);
    const expectedAddress = await enterAddressManuallyPage.getAddressInputValues();
    await enterAddressManuallyPage.clickContinue();

    await checkYourAnswersPage.clickMobileNumberChangeLink();
    await confirmMobileNumberPage.fillAlternativeMobileNumberAndContinue(personalDetails);

    const actualAddress = await checkYourAnswersPage.getAddressValue();
    expect(actualAddress?.trim()).toBe(expectedAddress);

    const actualMobileNumber = await checkYourAnswersPage.getMobileNumberValue();
    expect(actualMobileNumber?.replace(/[^\d+]/g, "")).toBe(
      personalDetails.mobileNumber.replace(/[^\d+]/g, ""),
    );

    const isChecked = await checkYourAnswersPage.isConsentCheckboxChecked();
    expect(isChecked).toBe(true);
  });
});
