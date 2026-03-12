import { test } from "../../fixtures/CombinedTestFixture";
import { expect } from "@playwright/test";
import { AddressModel } from "../../models/Address";
import { PersonalDetailsModel } from "../../models/PersonalDetails";

const randomAddress = AddressModel.getRandomAddress();
const personalDetails = PersonalDetailsModel.getRandomPersonalDetails();

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
    const newRandomAddress = AddressModel.getRandomAddress();
    await enterDeliveryAddressPage.fillPostCodeAndContinue(randomAddress);
    await selectDeliveryAddressPage.clickEditPostcodeLink();
    await enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue(newRandomAddress);
    const selectedAddress = await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await confirmMobileNumberPage.selectConfirmMobileNumberAndContinue();
    const actualAddress = await checkYourAnswersPage.getAddressValue();

    // Verify all actual address records are present in selected address - selected address can contain additional information like building name which is not present in actual address
    actualAddress?.forEach(addressLine => {
      expect(selectedAddress).toContainEqual(addressLine);
    });
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
    expect(mobileNumber?.replace(/[^\d+]/g, "")).toContain(
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
    const newAddress = AddressModel.getRandomAddress();
    const newPersonalDetails = PersonalDetailsModel.getRandomPersonalDetails();
    await checkYourAnswersPage.clickDeliveryAddressChangeLink();
    await enterDeliveryAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.fillDeliveryAddressFields(newAddress);
    await enterAddressManuallyPage.clickContinue();

    await checkYourAnswersPage.clickMobileNumberChangeLink();
    await confirmMobileNumberPage.fillAlternativeMobileNumberAndContinue(newPersonalDetails);

    const actualAddress = await checkYourAnswersPage.getAddressValue();
    expect(actualAddress).toEqual(newAddress.toStringArray());
    const actualMobileNumber = await checkYourAnswersPage.getMobileNumberValue();
    expect(actualMobileNumber?.replace(/[^\d+]/g, "")).toContain(
      newPersonalDetails.mobileNumber.replace(/[^\d+]/g, ""),
    );

    const isChecked = await checkYourAnswersPage.isConsentCheckboxChecked();
    expect(isChecked).toBe(true);
  });
});
