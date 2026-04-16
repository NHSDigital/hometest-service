import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { AddressModel } from "../../models/Address";
import { PersonalDetailsModel } from "../../models/PersonalDetails";

const randomAddress = AddressModel.getRandomAddress();
const personalDetails = PersonalDetailsModel.getRandomPersonalDetails();
const makeAComplaintUrl = "https://ico.org.uk/make-a-complaint/";
const cyberAwareUrl = "https://www.ncsc.gov.uk/cyberaware/home";
const helpAndSupportUrl = "https://www.nhs.uk/nhs-app/help/";

test.describe("Editing during the order flow", { tag: "@ui" }, () => {
  test.beforeEach(async ({
    beforeYouStartPage,
    getSelfTestKitPage
  }) => {
    await beforeYouStartPage.navigate();
    await beforeYouStartPage.clickContinueToOrderKitButton();
    await getSelfTestKitPage.clickStartNowButton();
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
    actualAddress?.forEach((addressLine) => {
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
      beforeYouStartPage,
      getSelfTestKitPage,
      bloodSampleGuidePage,
      enterDeliveryAddressPage,
      selectDeliveryAddressPage,
      howComfortablePrickingFingerPage,
      confirmMobileNumberPage,
      checkYourAnswersPage,
    }) => {
      await beforeYouStartPage.navigate();
      await beforeYouStartPage.clickContinueToOrderKitButton();
      await expect(getSelfTestKitPage.headerText).toHaveText("Get a self-test kit for HIV");
      await getSelfTestKitPage.clickBloodSampleGuideLink();
      await bloodSampleGuidePage.waitUntilPageLoaded();
      await bloodSampleGuidePage.clickBackLink();
      await getSelfTestKitPage.clickStartNowButton();
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

test("Verify Privacy Policy page", async ({ beforeYouStartPage, getSelfTestKitPage, privacyPolicyPage }) => {
  await beforeYouStartPage.navigate();
  await beforeYouStartPage.clickContinueToOrderKitButton();
  await expect(getSelfTestKitPage.headerText).toHaveText("Get a self-test kit for HIV");
  await getSelfTestKitPage.clickPrivacyPolicyLink();
  const actualHeaderText = await privacyPolicyPage.getHeaderText();
  expect(actualHeaderText).toBe("Hometest Privacy Policy - Draft v1.0 Jan 2026");
  await expect(privacyPolicyPage.makeAComplaintLink).toHaveAttribute("href", makeAComplaintUrl);
});

test("Verify Terms of Use page", async ({
  beforeYouStartPage,
  getSelfTestKitPage,
  termsOfUsePage,
  privacyPolicyPage,
}) => {
  await beforeYouStartPage.navigate();
  await beforeYouStartPage.clickContinueToOrderKitButton();
  await expect(getSelfTestKitPage.headerText).toHaveText("Get a self-test kit for HIV");
  await getSelfTestKitPage.clickTermsOfUseLink();
  await termsOfUsePage.waitUntilPageLoaded();

  await expect(termsOfUsePage.cyberAwareLink).toHaveAttribute("href", cyberAwareUrl);
  await expect(termsOfUsePage.helpAndSupportLink).toHaveAttribute("href", helpAndSupportUrl);

  await termsOfUsePage.clickHomeTestPrivacyPolicyLink();
  await privacyPolicyPage.waitUntilPageLoaded();
  await privacyPolicyPage.clickBackLink();
  await termsOfUsePage.waitUntilPageLoaded();
  await termsOfUsePage.clickBackLink();
  await expect(getSelfTestKitPage.headerText).toHaveText("Get a self-test kit for HIV");
});
